// Personalized wardrobe builder.
//
// Given a user's style profile (style + budget), produces a curated shopping
// list of wardrobe pieces with prices and shop recommendations tuned to their
// budget tier. The outfit generator (lib/outfits.ts) composes looks from this
// wardrobe so what users are told to wear matches what they're told to buy.

import { useEffect, useReducer } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BudgetRange,
  ClothingCategory,
  StyleType,
  WardrobeItem,
} from './types';
import { getProfile } from './profile';
import { trackEvent } from './posthog';

const STORAGE_KEY = 'user_wardrobe';

// ─── Store ───────────────────────────────────────────────────────

import api from './api';

let wardrobe: WardrobeItem[] = [];
let hydrated = false;
let hydrationPromise: Promise<WardrobeItem[]> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Function to persist (no longer needed directly since backend handles it, but keep for fallback)
async function persist() {
  try {
    await api.post('/style/wardrobe', { items: wardrobe });
  } catch (error: any) {
    console.error('Failed to persist wardrobe', error.response?.data || error);
    const backendMessage = error.response?.data?.message || error.message || 'Failed to persist wardrobe';
    throw new Error(backendMessage);
  }
}

export async function hydrateWardrobe(retryCount = 0): Promise<WardrobeItem[]> {
  if (hydrated) return wardrobe;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        return [];
      }

      console.log(`[Wardrobe Cache] Fetching user wardrobe (attempt ${retryCount + 1})...`);
      const res = await api.get('/style/wardrobe');
      if (res.data && Array.isArray(res.data)) {
        wardrobe = res.data;
        hydrated = true;
      } else {
        wardrobe = [];
        hydrated = true;
      }
    } catch (error: any) {
      console.error('[Wardrobe Cache] Failed to hydrate:', error?.response?.status, error?.message || error);
      if (retryCount < 3) {
        console.log(`[Wardrobe Cache] Retrying hydration in 1.5s... (Attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        hydrationPromise = null; // Clear so the recursive call starts a new request
        return hydrateWardrobe(retryCount + 1);
      }
      wardrobe = [];
      hydrated = true; // Fallback to true after retries fail to prevent infinite splash loading
    } finally {
      hydrationPromise = null;
      emit();
    }
    return wardrobe;
  })();

  return hydrationPromise;
}

export function getWardrobe(): WardrobeItem[] {
  return wardrobe;
}

export function hasWardrobe(): boolean {
  return wardrobe.length > 0;
}

export function isWardrobeHydrated(): boolean {
  return hydrated;
}

/**
 * Build (or rebuild) the personalized wardrobe from the user's style + budget,
 * persist it, and return the items.
 */
export async function buildWardrobe(opts: {
  primaryStyle: StyleType;
  secondaryStyles: StyleType[];
  budget: BudgetRange;
}): Promise<WardrobeItem[]> {
  try {
    trackEvent('wardrobe_generation_requested', {
      primaryStyle: opts.primaryStyle,
      secondaryStylesCount: opts.secondaryStyles.length,
      budget: opts.budget,
    });
    const res = await api.post('/style/wardrobe/generate', {
      primaryStyle: opts.primaryStyle,
      secondaryStyles: opts.secondaryStyles,
      budget: opts.budget,
    });
    wardrobe = res.data;
    hydrated = true;
    emit();
    trackEvent('wardrobe_generation_succeeded', {
      itemCount: wardrobe.length,
      primaryStyle: opts.primaryStyle,
    });
    return wardrobe;
  } catch (error: any) {
    console.error('Failed to build wardrobe via AI', error.response?.data || error);
    const backendMessage = error.response?.data?.message || error.message || 'Failed to generate wardrobe';
    trackEvent('wardrobe_generation_failed', { error: backendMessage });
    throw new Error(backendMessage);
  }
}

export async function clearWardrobe(): Promise<void> {
  wardrobe = [];
  hydrated = false;
  hydrationPromise = null;
  emit();
}

export async function markAsOwned(id: string): Promise<void> {
  const item = wardrobe.find((w) => w.id === id || (w as any)._id === id);
  if (item) {
    item.status = 'owned';
    try {
      const endpointId = (item as any)._id || item.id;
      await api.put(`/style/wardrobe/${endpointId}`, { status: 'owned' });
      trackEvent('wardrobe_item_owned', {
        itemId: endpointId,
        name: item.name,
        category: item.category,
      });
    } catch (e) { console.error(e) }
    emit();
  }
}

export async function removeWardrobeItem(id: string): Promise<void> {
  const item = wardrobe.find((w) => w.id === id || (w as any)._id === id);
  wardrobe = wardrobe.filter((w) => w.id !== id && (w as any)._id !== id);
  if (item) {
    try {
      const endpointId = (item as any)._id || item.id;
      await api.delete(`/style/wardrobe/${endpointId}`);
      trackEvent('wardrobe_item_deleted', {
        itemId: endpointId,
        name: item.name,
        category: item.category,
      });
    } catch (e) { console.error(e) }
  }
  emit();
}

export async function swapItem(id: string): Promise<void> {
  const itemIndex = wardrobe.findIndex((w) => w.id === id || (w as any)._id === id);
  if (itemIndex > -1) {
    const item = wardrobe[itemIndex];
    const p = getProfile();
    try {
      trackEvent('wardrobe_item_swap_requested', {
        itemId: item.id || (item as any)._id,
        category: item.category,
      });
      const res = await api.post('/style/wardrobe/generate-single', {
        primaryStyle: p?.primaryStyle || 'casual',
        secondaryStyles: p?.secondaryStyles || [],
        budget: p?.budget || 'mid-range',
        priorityPhase: item.priorityPhase,
      });
      // Replace the item with the newly generated AI item
      const newItem = res.data;
      wardrobe[itemIndex] = newItem;
      emit();
      
      trackEvent('wardrobe_item_swap_succeeded', {
        oldItemId: item.id || (item as any)._id,
        newItemId: newItem._id || newItem.id,
        category: newItem.category,
        name: newItem.name,
      });

      // Also delete the old one from the backend
      try {
        const endpointId = (item as any)._id || item.id;
        await api.delete(`/style/wardrobe/${endpointId}`);
      } catch (e) {}
    } catch (error: any) {
      console.error('Failed to swap wardrobe item via AI', error.response?.data || error);
      const backendMessage = error.response?.data?.message || error.message || 'Failed to swap item';
      trackEvent('wardrobe_item_swap_failed', {
        itemId: item.id || (item as any)._id,
        error: backendMessage,
      });
      throw new Error(backendMessage);
    }
  }
}


/** Reactive accessor for the wardrobe list. */
export function useWardrobe(): WardrobeItem[] {
  const [, force] = useReducer((c) => c + 1, 0);
  useEffect(() => {
    listeners.add(force);
    void hydrateWardrobe();
    return () => {
      listeners.delete(force);
    };
  }, []);
  return wardrobe;
}

// Auto-generated fallback default export to keep parity with other lib modules.
const _default = {} as any;
export default _default;

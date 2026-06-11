// Personalized wardrobe builder.
//
// Given a user's style profile (style + budget), produces a curated shopping
// list of wardrobe pieces with prices and shop recommendations tuned to their
// budget tier. The outfit generator (lib/outfits.ts) composes looks from this
// wardrobe so what users are told to wear matches what they're told to buy.

import { useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BudgetRange,
  ClothingCategory,
  StyleType,
  WardrobeItem,
} from './types';
import { getProfile } from './profile';

const STORAGE_KEY = 'user_wardrobe';

// ─── Store ───────────────────────────────────────────────────────

import api from './api';

let wardrobe: WardrobeItem[] = [];
let hydrated = false;
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

export async function hydrateWardrobe(): Promise<WardrobeItem[]> {
  if (hydrated) return wardrobe;
  try {
    const res = await api.get('/style/wardrobe');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      wardrobe = res.data;
    } else {
      wardrobe = [];
    }
  } catch {
    wardrobe = [];
  }
  hydrated = true;
  emit();
  return wardrobe;
}

export function getWardrobe(): WardrobeItem[] {
  return wardrobe;
}

export function hasWardrobe(): boolean {
  return wardrobe.length > 0;
}

/**
 * Build (or rebuild) the personalized wardrobe from the user's style + budget,
 * persist it, and return the items.
 */
export async function buildWardrobe(opts: {
  primaryStyle: StyleType;
  secondaryStyles: StyleType[];
  budget: BudgetRange;
  existingBasics?: string[];
}): Promise<WardrobeItem[]> {
  try {
    const res = await api.post('/style/wardrobe/generate', {
      primaryStyle: opts.primaryStyle,
      secondaryStyles: opts.secondaryStyles,
      budget: opts.budget,
    });
    wardrobe = res.data;
    hydrated = true;
    emit();
    return wardrobe;
  } catch (error: any) {
    console.error('Failed to build wardrobe via AI', error.response?.data || error);
    const backendMessage = error.response?.data?.message || error.message || 'Failed to generate wardrobe';
    throw new Error(backendMessage);
  }
}

export async function clearWardrobe(): Promise<void> {
  wardrobe = [];
  hydrated = false;
  emit();
}

export async function markAsOwned(id: string): Promise<void> {
  const item = wardrobe.find((w) => w.id === id || (w as any)._id === id);
  if (item) {
    item.status = 'owned';
    try {
      const endpointId = (item as any)._id || item.id;
      await api.put(`/style/wardrobe/${endpointId}`, { status: 'owned' });
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
      const res = await api.post('/style/wardrobe/generate-single', {
        primaryStyle: p?.primaryStyle || 'casual',
        secondaryStyles: p?.secondaryStyles || [],
        budget: p?.budget || 'mid-range',
        priorityPhase: item.priorityPhase,
      });
      // Replace the item with the newly generated AI item
      wardrobe[itemIndex] = res.data;
      emit();
      
      // Also delete the old one from the backend
      try {
        const endpointId = (item as any)._id || item.id;
        await api.delete(`/style/wardrobe/${endpointId}`);
      } catch (e) {}
    } catch (error: any) {
      console.error('Failed to swap wardrobe item via AI', error.response?.data || error);
      const backendMessage = error.response?.data?.message || error.message || 'Failed to swap item';
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

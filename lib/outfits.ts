// Shared outfit data layer.
//
// Composes outfits from the user's personalized wardrobe (lib/wardrobe.ts) so
// what the app tells users to wear is drawn from what it told them to buy.
// Outfits live in a module-level store, seeded with mock history and appended
// to by `generateOutfit`.

import { useEffect, useReducer } from 'react';
import type { Outfit, OutfitItem, OutfitOccasion } from './types';
import * as SecureStore from 'expo-secure-store';
import { getWardrobe } from './wardrobe';
import { getProfile } from './profile';
import { trackEvent } from './posthog';

// ─── Occasion metadata + recipes ─────────────────────────────────

export const OCCASION_META: Record<OutfitOccasion, { label: string; icon: string }> = {
  casual: { label: 'Casual', icon: 'cafe-outline' },
  work: { label: 'Work', icon: 'briefcase-outline' },
  'date-night': { label: 'Date Night', icon: 'heart-outline' },
  'night-out': { label: 'Night Out', icon: 'wine-outline' },
  travel: { label: 'Travel', icon: 'airplane-outline' },
  wedding: { label: 'Wedding', icon: 'flower-outline' },
  'business-meeting': { label: 'Business Meeting', icon: 'people-outline' },
  vacation: { label: 'Vacation', icon: 'sunny-outline' },
  errands: { label: 'Errands', icon: 'bag-handle-outline' },
  gym: { label: 'Gym', icon: 'barbell-outline' },
};

export function occasionLabel(occasion: OutfitOccasion): string {
  return OCCASION_META[occasion]?.label ?? occasion;
}


import api from './api';

let store: Outfit[] = [];
let hydrated = false;
let hydrationPromise: Promise<Outfit[]> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let isGeneratingOutfit = false;
let regeneratingOutfitId: string | null = null;

export function getIsGeneratingOutfit(): boolean {
  return isGeneratingOutfit;
}

export function getRegeneratingOutfitId(): string | null {
  return regeneratingOutfitId;
}

export async function hydrateOutfits(retryCount = 0): Promise<Outfit[]> {
  if (hydrated) return store;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        return [];
      }

      console.log(`[Outfits Cache] Fetching outfits (attempt ${retryCount + 1})...`);
      const res = await api.get('/style/outfits');
      if (res.data && Array.isArray(res.data)) {
        store = res.data.map(o => {
          const outfit = { ...o, id: o._id || o.id };
          if (outfit.items) {
            outfit.items = outfit.items.map((i: any) => ({
              ...i,
              wardrobeItem: i.wardrobeItemId || i.wardrobeItem
            }));
          }
          return outfit;
        });
        hydrated = true;
      }
    } catch (error: any) {
      console.error('[Outfits Cache] Failed to hydrate:', error?.response?.status, error?.message || error);
      if (retryCount < 3) {
        console.log(`[Outfits Cache] Retrying hydration in 1.5s... (Attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        hydrationPromise = null; // Clear so the recursive call starts a new request
        return hydrateOutfits(retryCount + 1);
      }
      hydrated = true; // Fallback to true after retries fail to prevent infinite splash loading
    } finally {
      hydrationPromise = null;
      emit();
    }
    return store;
  })();

  return hydrationPromise;
}

export function getOutfits(): Outfit[] {
  // Pinned outfits float to the top; within each group keep newest-first.
  return [...store].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function useOutfits(): { outfits: Outfit[]; isGenerating: boolean; regeneratingOutfitId: string | null } {
  const [, force] = useReducer((c) => c + 1, 0);
  useEffect(() => {
    listeners.add(force);
    void hydrateOutfits();
    return () => {
      listeners.delete(force);
    };
  }, []);
  return { outfits: getOutfits(), isGenerating: isGeneratingOutfit, regeneratingOutfitId };
}

export async function refreshOutfits(): Promise<Outfit[]> {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (!token) return [];
    
    const res = await api.get('/style/outfits');
    if (res.data && Array.isArray(res.data)) {
      store = res.data.map(o => {
        const outfit = { ...o, id: o._id || o.id };
        if (outfit.items) {
          outfit.items = outfit.items.map((i: any) => ({
            ...i,
            wardrobeItem: i.wardrobeItemId || i.wardrobeItem
          }));
        }
        return outfit;
      });
      hydrated = true;
      emit();
    }
  } catch (error) {
    console.error('[Outfits Cache] Failed to refresh:', error);
  }
  return store;
}

export function getOutfitById(id: string): Outfit | undefined {
  return store.find((o) => o.id === id || (o as any)._id === id);
}

export async function removeOutfit(id: string): Promise<void> {
  const index = store.findIndex((o) => o.id === id || (o as any)._id === id);
  if (index !== -1) {
    const outfit = store[index];
    store.splice(index, 1);
    emit();
    try {
      const endpointId = (outfit as any)._id || outfit.id;
      await api.delete(`/style/outfits/${endpointId}`);
      trackEvent('outfit_deleted', { outfitId: endpointId, occasion: outfit.occasion });
    } catch (e) { console.error(e) }
  }
}

export function clearOutfits(): void {
  store.length = 0;
  hydrated = false;
  hydrationPromise = null;
  emit();
}

const mockWeather = [
  { temp: 22, condition: 'Sunny' },
  { temp: 15, condition: 'Cloudy' },
  { temp: 28, condition: 'Clear' },
  { temp: 8, condition: 'Rainy' },
];

/**
 * Generate a new outfit for the given occasion from the user's wardrobe, add it
 * to the store (newest first) and return it.
 */
export async function generateOutfit(occasion: OutfitOccasion, photo?: string, swapOutfitId?: string): Promise<Outfit> {
  const weatherContext = mockWeather[Math.floor(Math.random() * mockWeather.length)];

  if (swapOutfitId) {
    regeneratingOutfitId = swapOutfitId;
    emit();
  } else {
    isGeneratingOutfit = true;
    emit();
  }

  try {
    trackEvent('outfit_generation_requested', {
      occasion,
      hasLikenessPhoto: !!photo,
    });
    const payload = {
      occasion,
      weatherContext,
      photo,
      swapOutfitId,
    };

    // Call our new AI generation endpoint
    const res = await api.post('/style/outfits/generate', payload);

    if (res.data) {
      // Re-hydrate the items from the returned populated object
      const created = res.data;
      created.id = created._id || created.id;
      created.items = created.items.map((i: any) => ({
        ...i,
        wardrobeItem: i.wardrobeItemId || i.wardrobeItem
      }));

      if (swapOutfitId) {
        const index = store.findIndex((o) => o.id === swapOutfitId || (o as any)._id === swapOutfitId);
        if (index !== -1) {
          store.splice(index, 1);
        }
      }

      store.unshift(created);
      trackEvent('outfit_generation_succeeded', {
        occasion,
        outfitId: created.id,
      });
      return created;
    } else {
      throw new Error('No data returned from backend');
    }
  } catch (e: any) {
    console.error('Failed to save outfit to backend', e.response?.data || e);
    // Throw the readable backend error up to the UI so it can alert the user
    const backendMessage = e.response?.data?.message || e.message || 'Failed to generate outfit';
    trackEvent('outfit_generation_failed', {
      occasion,
      error: backendMessage,
    });
    throw new Error(backendMessage);
  } finally {
    if (swapOutfitId) {
      regeneratingOutfitId = null;
      emit();
    } else {
      isGeneratingOutfit = false;
      emit();
    }
  }
}

/**
 * Record a thumbs up/down for an outfit. Updates the local store immediately so
 * the UI reflects the choice, then persists to the backend. Toggling the same
 * value again clears the feedback.
 */
export async function updateOutfitFeedback(
  id: string,
  feedback: 'like' | 'dislike',
): Promise<void> {
  const outfit = store.find((o) => o.id === id || (o as any)._id === id);
  if (!outfit) return;
  const next = outfit.feedback === feedback ? undefined : feedback;
  outfit.feedback = next;
  try {
    const endpointId = (outfit as any)._id || outfit.id;
    await api.put(`/style/outfits/${endpointId}`, { feedback: next ?? null });
    trackEvent('outfit_feedback_updated', {
      outfitId: endpointId,
      feedback: next || 'none',
      occasion: outfit.occasion,
    });
  } catch (e) {
    console.error('Failed to persist outfit feedback', e);
  }
}

/**
 * Pin/unpin an outfit. Pinned outfits are sorted to the top of the list
 * (see `getOutfits`). Updates locally first, then persists to the backend.
 */
export async function toggleOutfitPin(id: string): Promise<boolean> {
  const outfit = store.find((o) => o.id === id || (o as any)._id === id);
  if (!outfit) return false;
  const next = !outfit.pinned;
  outfit.pinned = next;
  emit();
  try {
    const endpointId = (outfit as any)._id || outfit.id;
    await api.put(`/style/outfits/${endpointId}`, { pinned: next });
    trackEvent('outfit_pin_toggled', {
      outfitId: endpointId,
      pinned: next,
      occasion: outfit.occasion,
    });
  } catch (e) {
    console.error('Failed to persist outfit pin', e);
  }
  return next;
}

// ─── Derived helpers ─────────────────────────────────────────────

function parseBudget(range: string): { min: number; max: number } {
  const nums = (range.match(/\d+/g) ?? []).map(Number);
  if (nums.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/** Estimated total cost range across an outfit's pieces. */
export function estimateOutfitBudget(outfit: Outfit): { min: number; max: number } {
  return outfit.items.reduce(
    (acc, item) => {
      if (!item.wardrobeItem) return acc;
      const { min, max } = parseBudget(item.wardrobeItem.budgetRange || '');
      return { min: acc.min + min, max: acc.max + max };
    },
    { min: 0, max: 0 },
  );
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  return `${diffInDays}d ago`;
}

// Auto-generated fallback default export to keep parity with other lib modules.
const _default = {} as any;
export default _default;

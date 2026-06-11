// Shared outfit data layer.
//
// Composes outfits from the user's personalized wardrobe (lib/wardrobe.ts) so
// what the app tells users to wear is drawn from what it told them to buy.
// Outfits live in a module-level store, seeded with mock history and appended
// to by `generateOutfit`.

import type { Outfit, OutfitItem, OutfitOccasion } from './types';
import { getWardrobe } from './wardrobe';
import { getProfile } from './profile';

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


const GENERATED_NAMES: Record<OutfitOccasion, string> = {
  casual: 'Easy Weekend',
  work: 'Sharp Workday',
  'date-night': 'Date Night Standout',
  'night-out': 'After Dark',
  travel: 'Travel Ready',
  wedding: 'Wedding Guest',
  'business-meeting': 'Boardroom Ready',
  vacation: 'Vacation Mode',
  errands: 'Quick Errands',
  gym: 'Active Day',
};

const PREVIEW_BY_OCCASION: Record<OutfitOccasion, string> = {
  casual: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
  work: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop',
  'date-night': 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&h=800&fit=crop',
  'night-out': 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&h=800&fit=crop',
  travel: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=800&fit=crop',
  wedding: 'https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=600&h=800&fit=crop',
  'business-meeting': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop',
  vacation: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=800&fit=crop',
  errands: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&h=800&fit=crop',
  gym: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=800&fit=crop',
};

function buildItems(occasion: OutfitOccasion, outfitId: string): OutfitItem[] {
  const wardrobe = getWardrobe();
  // If no wardrobe, return empty
  if (wardrobe.length === 0) return [];
  
  // Pick 3-4 random items from the user's actual generated wardrobe
  const count = Math.min(wardrobe.length, Math.floor(Math.random() * 2) + 3);
  const shuffled = [...wardrobe].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  return selected.map((wardrobeItem) => ({
    id: `${outfitId}-${wardrobeItem.id}`,
    wardrobeItemId: wardrobeItem.id,
    wardrobeItem,
  }));
}

/**
 * The preview image for a generated outfit. When the user has uploaded a photo
 * we use it as the base so previews reflect their own face/body shape.
 */
function previewFor(occasion: OutfitOccasion): string {
  return getProfile()?.photos?.front ?? PREVIEW_BY_OCCASION[occasion];
}

// ─── Store ───────────────────────────────────────────────────────

function makeOutfit(
  id: string,
  occasion: OutfitOccasion,
  name: string,
  createdAt: string,
  previewUrl: string,
): Outfit {
  return {
    id,
    userId: 'user1',
    name,
    occasion,
    items: buildItems(occasion, id),
    previewUrl,
    createdAt,
  };
}

import api from './api';

let store: Outfit[] = [];
let hydrated = false;

export async function hydrateOutfits(): Promise<Outfit[]> {
  if (hydrated) return store;
  try {
    const res = await api.get('/style/outfits');
    if (res.data && Array.isArray(res.data)) {
      store = res.data.map(o => ({ ...o, id: o._id || o.id }));
    }
  } catch {
    // fallback
  }
  hydrated = true;
  return store;
}

export function getOutfits(): Outfit[] {
  return [...store];
}

export function getOutfitById(id: string): Outfit | undefined {
  return store.find((o) => o.id === id || (o as any)._id === id);
}

export async function removeOutfit(id: string): Promise<void> {
  const index = store.findIndex((o) => o.id === id || (o as any)._id === id);
  if (index !== -1) {
    const outfit = store[index];
    store.splice(index, 1);
    try {
      await api.delete(`/style/outfits/${(outfit as any)._id || outfit.id}`);
    } catch (e) { console.error(e) }
  }
}

export function clearOutfits(): void {
  store.length = 0;
  hydrated = false;
}

const mockWeather = [
  { temp: 22, condition: 'Sunny' },
  { temp: 15, condition: 'Cloudy' },
  { temp: 28, condition: 'Clear' },
  { temp: 8, condition: 'Rainy' },
];

let generatedCount = 0;
/**
 * Generate a new outfit for the given occasion from the user's wardrobe, add it
 * to the store (newest first) and return it.
 */
export async function generateOutfit(occasion: OutfitOccasion): Promise<Outfit> {
  const weatherContext = mockWeather[Math.floor(Math.random() * mockWeather.length)];
  
  try {
    const payload = {
      occasion,
      weatherContext,
    };
    
    // Call our new AI generation endpoint
    const res = await api.post('/style/outfits/generate', payload);
    
    if (res.data) {
      // Re-hydrate the items from the returned populated object
      const created = res.data;
      created.id = created._id || created.id;
      created.items = created.items.map((i: any) => ({
        wardrobeItem: i.wardrobeItemId || i.wardrobeItem
      }));
      store.unshift(created);
      return created;
    } else {
      throw new Error('No data returned from backend');
    }
  } catch (e: any) {
    console.error('Failed to save outfit to backend', e.response?.data || e);
    // Throw the readable backend error up to the UI so it can alert the user
    const backendMessage = e.response?.data?.message || e.message || 'Failed to generate outfit';
    throw new Error(backendMessage);
  }
}

export function updateOutfitFeedback(id: string, feedback: 'like' | 'dislike'): void {
  const outfit = store.find((o) => o.id === id);
  if (outfit) {
    outfit.feedback = feedback;
  }
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
      const { min, max } = parseBudget(item.wardrobeItem.budgetRange);
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

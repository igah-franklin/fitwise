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

// ─── Catalog ─────────────────────────────────────────────────────

interface CatalogPiece {
  name: string;
  category: ClothingCategory;
  subcategory: string;
  fit: string;
  color: string;
  /** Mid-range baseline price range; scaled per budget tier. */
  base: [number, number];
  imageUrl: string;
}

export const CATALOG = {
  whiteOxford: { name: 'White Oxford Shirt', category: 'tops', subcategory: 'shirts', fit: 'Fitted', color: 'White', base: [55, 80], imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&h=400&fit=crop' },
  chambrayShirt: { name: 'Chambray Shirt', category: 'tops', subcategory: 'shirts', fit: 'Regular', color: 'Light Blue', base: [55, 75], imageUrl: 'https://images.unsplash.com/photo-1588359348347-9bc6cbea68cb?w=400&h=400&fit=crop' },
  whiteTee: { name: 'Premium White Tee', category: 'tops', subcategory: 't-shirts', fit: 'Slim', color: 'White', base: [25, 40], imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
  navyTee: { name: 'Navy Crew Tee', category: 'tops', subcategory: 't-shirts', fit: 'Slim', color: 'Navy', base: [25, 40], imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop' },
  navyChinos: { name: 'Navy Chinos', category: 'bottoms', subcategory: 'chinos', fit: 'Slim', color: 'Navy', base: [65, 95], imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop' },
  darkDenim: { name: 'Dark Denim Jeans', category: 'bottoms', subcategory: 'jeans', fit: 'Slim', color: 'Dark Indigo', base: [80, 120], imageUrl: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&fit=crop' },
  greyTrousers: { name: 'Grey Wool Trousers', category: 'bottoms', subcategory: 'trousers', fit: 'Tailored', color: 'Charcoal', base: [90, 140], imageUrl: 'https://images.unsplash.com/photo-1594938298596-880c85c2c77a?w=400&h=400&fit=crop' },
  navyBlazer: { name: 'Navy Blazer', category: 'outerwear', subcategory: 'blazers', fit: 'Tailored', color: 'Navy', base: [220, 360], imageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=400&h=400&fit=crop' },
  bomberJacket: { name: 'Olive Bomber Jacket', category: 'outerwear', subcategory: 'jackets', fit: 'Regular', color: 'Olive', base: [120, 180], imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop' },
  whiteSneakers: { name: 'White Leather Sneakers', category: 'shoes', subcategory: 'sneakers', fit: 'True to Size', color: 'White', base: [90, 140], imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop' },
  brownLoafers: { name: 'Brown Suede Loafers', category: 'shoes', subcategory: 'loafers', fit: 'True to Size', color: 'Tan', base: [130, 190], imageUrl: 'https://images.unsplash.com/photo-1614252339460-e14b1070e1c6?w=400&h=400&fit=crop' },
  chelseaBoots: { name: 'Chelsea Boots', category: 'shoes', subcategory: 'boots', fit: 'True to Size', color: 'Black', base: [150, 230], imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=400&fit=crop' },
  leatherBelt: { name: 'Leather Belt', category: 'accessories', subcategory: 'belts', fit: 'Standard', color: 'Brown', base: [45, 80], imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&h=400&fit=crop' },
  watch: { name: 'Minimalist Watch', category: 'accessories', subcategory: 'watches', fit: 'Standard', color: 'Silver', base: [90, 160], imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop' },
} satisfies Record<string, CatalogPiece>;

export type CatalogKey = keyof typeof CATALOG;

// ─── Budget tiers ────────────────────────────────────────────────

const TIER_FACTOR: Record<BudgetRange, number> = {
  budget: 0.55,
  'mid-range': 1,
  premium: 2.2,
};

const SHOPS: Record<ClothingCategory, Record<BudgetRange, string>> = {
  tops: { budget: 'Uniqlo, H&M', 'mid-range': 'COS, Everlane', premium: 'Sunspel, Officine Générale' },
  bottoms: { budget: "Levi's, Uniqlo", 'mid-range': 'Bonobos, Everlane', premium: 'Incotex, A.P.C.' },
  outerwear: { budget: 'Uniqlo, Zara', 'mid-range': 'J.Crew, Suit Supply', premium: 'Theory, Boglioli' },
  shoes: { budget: 'Adidas, Clarks', 'mid-range': 'Thursday Boots, Beckett Simonon', premium: 'Common Projects, Crockett & Jones' },
  accessories: { budget: 'Fossil, Timex', 'mid-range': 'Daniel Wellington, Anson Belt', premium: 'Montblanc, TAG Heuer' },
};

const round5 = (n: number) => Math.round(n / 5) * 5;

export function currentBudget(): BudgetRange {
  return getProfile()?.budget ?? 'mid-range';
}

function calculateSize(category: ClothingCategory): string {
  const p = getProfile();
  if (!p || !p.measurements) return 'M';
  const { chest, waist } = p.measurements;
  if (category === 'tops' || category === 'outerwear') {
    const c = parseInt(chest, 10);
    if (!c) return 'M';
    if (c < 95) return 'S';
    if (c > 105) return 'L';
    return 'M';
  } else if (category === 'bottoms') {
    const w = parseInt(waist, 10);
    if (!w) return '32';
    const inches = Math.round(w / 2.54);
    return `${inches}`;
  } else if (category === 'shoes') {
    return '10';
  }
  return 'One Size';
}

function buildPiece(key: CatalogKey, tier: BudgetRange, status: WardrobeItem['status'], priorityPhase: 1 | 2 | 3 = 1): WardrobeItem {
  const piece = CATALOG[key];
  const factor = TIER_FACTOR[tier];
  const min = round5(piece.base[0] * factor);
  const max = round5(piece.base[1] * factor);
  return {
    id: `w-${key}`,
    name: piece.name,
    category: piece.category,
    subcategory: piece.subcategory,
    fit: piece.fit,
    color: piece.color,
    quantity: 1,
    budgetRange: `$${min}-${max}`,
    shoppingRecommendation: SHOPS[piece.category][tier],
    status,
    priorityPhase,
    recommendedSize: calculateSize(piece.category),
    imageUrl: piece.imageUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Style → wardrobe shopping lists ─────────────────────────────

const STYLE_WARDROBE: Record<StyleType, CatalogKey[]> = {
  casual: ['whiteTee', 'navyTee', 'darkDenim', 'navyChinos', 'whiteSneakers', 'bomberJacket', 'leatherBelt', 'watch'],
  'smart-casual': ['whiteOxford', 'chambrayShirt', 'navyChinos', 'darkDenim', 'brownLoafers', 'whiteSneakers', 'leatherBelt', 'watch'],
  'business-casual': ['whiteOxford', 'navyBlazer', 'greyTrousers', 'navyChinos', 'brownLoafers', 'leatherBelt', 'watch'],
  minimalist: ['whiteTee', 'whiteOxford', 'greyTrousers', 'darkDenim', 'whiteSneakers', 'watch'],
  streetwear: ['whiteTee', 'navyTee', 'bomberJacket', 'darkDenim', 'whiteSneakers', 'watch'],
  classic: ['whiteOxford', 'navyBlazer', 'greyTrousers', 'chelseaBoots', 'brownLoafers', 'leatherBelt', 'watch'],
  modern: ['whiteTee', 'navyBlazer', 'darkDenim', 'chelseaBoots', 'whiteSneakers', 'watch'],
};

// ─── Store ───────────────────────────────────────────────────────

import api from './api';

let wardrobe: WardrobeItem[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function persist() {
  try {
    await api.post('/style/wardrobe', { items: wardrobe });
  } catch (error) {
    console.error('Failed to persist wardrobe', error);
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
  const keys = new Set<CatalogKey>(STYLE_WARDROBE[opts.primaryStyle]);
  opts.secondaryStyles.forEach((s) => STYLE_WARDROBE[s]?.forEach((k) => keys.add(k)));

  wardrobe = [...keys].map((key, index) => {
    const phase = index < 4 ? 1 : index < 8 ? 2 : 3;
    const status = opts.existingBasics?.includes(key as string) ? 'owned' : 'recommended';
    return buildPiece(key, opts.budget, status, phase);
  });
  hydrated = true;
  await persist();
  // Fetch again to get the real MongoDB _ids
  await hydrateWardrobe();
  emit();
  return wardrobe;
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
      await api.put(`/style/wardrobe/${item.id.replace('w-', '')}`, { status: 'owned' });
    } catch (e) { console.error(e) }
    emit();
  }
}

export async function removeWardrobeItem(id: string): Promise<void> {
  const item = wardrobe.find((w) => w.id === id || (w as any)._id === id);
  wardrobe = wardrobe.filter((w) => w.id !== id && (w as any)._id !== id);
  if (item) {
    try {
      await api.delete(`/style/wardrobe/${item.id.replace('w-', '')}`);
    } catch (e) { console.error(e) }
  }
  emit();
}

export async function swapItem(id: string): Promise<void> {
  const itemIndex = wardrobe.findIndex((w) => w.id === id);
  if (itemIndex > -1) {
    const existingKeys = wardrobe.map((w) => w.id.replace('w-', ''));
    const availableKeys = (Object.keys(CATALOG) as CatalogKey[]).filter(
      (k) => !existingKeys.includes(k)
    );
    if (availableKeys.length > 0) {
      const newKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
      wardrobe[itemIndex] = buildPiece(
        newKey,
        currentBudget(),
        'recommended',
        wardrobe[itemIndex].priorityPhase
      );
      await persist();
      emit();
    }
  }
}

/**
 * Resolve a catalog piece for use in an outfit. If the piece is part of the
 * user's built wardrobe it is treated as owned; otherwise it's a suggested
 * addition priced at the user's current budget tier.
 */
export function resolvePiece(key: CatalogKey): WardrobeItem {
  const owned = wardrobe.find((w) => w.id === `w-${key}`);
  if (owned) return owned;
  return buildPiece(key, currentBudget(), 'recommended');
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

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
}

export const CATALOG = {
  whiteOxford: { name: 'White Oxford Shirt', category: 'tops', subcategory: 'shirts', fit: 'Fitted', color: 'White', base: [55, 80] },
  chambrayShirt: { name: 'Chambray Shirt', category: 'tops', subcategory: 'shirts', fit: 'Regular', color: 'Light Blue', base: [55, 75] },
  whiteTee: { name: 'Premium White Tee', category: 'tops', subcategory: 't-shirts', fit: 'Slim', color: 'White', base: [25, 40] },
  navyTee: { name: 'Navy Crew Tee', category: 'tops', subcategory: 't-shirts', fit: 'Slim', color: 'Navy', base: [25, 40] },
  navyChinos: { name: 'Navy Chinos', category: 'bottoms', subcategory: 'chinos', fit: 'Slim', color: 'Navy', base: [65, 95] },
  darkDenim: { name: 'Dark Denim Jeans', category: 'bottoms', subcategory: 'jeans', fit: 'Slim', color: 'Dark Indigo', base: [80, 120] },
  greyTrousers: { name: 'Grey Wool Trousers', category: 'bottoms', subcategory: 'trousers', fit: 'Tailored', color: 'Charcoal', base: [90, 140] },
  navyBlazer: { name: 'Navy Blazer', category: 'outerwear', subcategory: 'blazers', fit: 'Tailored', color: 'Navy', base: [220, 360] },
  bomberJacket: { name: 'Olive Bomber Jacket', category: 'outerwear', subcategory: 'jackets', fit: 'Regular', color: 'Olive', base: [120, 180] },
  whiteSneakers: { name: 'White Leather Sneakers', category: 'shoes', subcategory: 'sneakers', fit: 'True to Size', color: 'White', base: [90, 140] },
  brownLoafers: { name: 'Brown Suede Loafers', category: 'shoes', subcategory: 'loafers', fit: 'True to Size', color: 'Tan', base: [130, 190] },
  chelseaBoots: { name: 'Chelsea Boots', category: 'shoes', subcategory: 'boots', fit: 'True to Size', color: 'Black', base: [150, 230] },
  leatherBelt: { name: 'Leather Belt', category: 'accessories', subcategory: 'belts', fit: 'Standard', color: 'Brown', base: [45, 80] },
  watch: { name: 'Minimalist Watch', category: 'accessories', subcategory: 'watches', fit: 'Standard', color: 'Silver', base: [90, 160] },
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

function buildPiece(key: CatalogKey, tier: BudgetRange, status: WardrobeItem['status']): WardrobeItem {
  const piece = CATALOG[key];
  const factor = TIER_FACTOR[tier];
  const min = round5(piece.base[0] * factor);
  const max = round5(piece.base[1] * factor);
  return {
    id: `w-${key}`,
    userId: 'user1',
    name: piece.name,
    category: piece.category,
    subcategory: piece.subcategory,
    fit: piece.fit,
    color: piece.color,
    quantity: 1,
    budgetRange: `$${min}-${max}`,
    shoppingRecommendation: SHOPS[piece.category][tier],
    status,
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

let wardrobe: WardrobeItem[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobe));
  } catch {
    // keep in-memory copy
  }
}

export async function hydrateWardrobe(): Promise<WardrobeItem[]> {
  if (hydrated) return wardrobe;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    wardrobe = raw ? (JSON.parse(raw) as WardrobeItem[]) : [];
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
}): Promise<WardrobeItem[]> {
  const keys = new Set<CatalogKey>(STYLE_WARDROBE[opts.primaryStyle]);
  opts.secondaryStyles.forEach((s) => STYLE_WARDROBE[s]?.forEach((k) => keys.add(k)));

  wardrobe = [...keys].map((key) => buildPiece(key, opts.budget, 'recommended'));
  hydrated = true;
  await persist();
  emit();
  return wardrobe;
}

export async function clearWardrobe(): Promise<void> {
  wardrobe = [];
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
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

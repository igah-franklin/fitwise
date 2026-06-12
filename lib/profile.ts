// User style profile: measurements, style preferences, budget and photos.
//
// Persisted to AsyncStorage with a synchronous in-memory cache so the generate
// flows can gate on `isProfileComplete()` without awaiting, plus a `useProfile`
// hook for reactive UI.

import { useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BudgetRange, StyleType } from './types';

const STORAGE_KEY = 'user_style_profile';

export interface Measurements {
  height: string; // cm
  weight: string; // kg
  chest: string; // cm
  waist: string; // cm
  shoulderWidth: string; // cm
  inseam: string; // cm
}

export interface ProfilePhotos {
  front?: string; // local uri
  side?: string; // local uri
}

export interface UserProfile {
  gender: string;
  measurements: Measurements;
  primaryStyle: StyleType;
  secondaryStyles: StyleType[];
  budget: BudgetRange;
  existingBasics?: string[];
  photos: ProfilePhotos;
  completedAt?: string;
}

export const EMPTY_MEASUREMENTS: Measurements = {
  height: '',
  weight: '',
  chest: '',
  waist: '',
  shoulderWidth: '',
  inseam: '',
};

export function emptyProfile(): UserProfile {
  return {
    gender: 'male',
    measurements: { ...EMPTY_MEASUREMENTS },
    primaryStyle: 'smart-casual',
    secondaryStyles: [],
    budget: 'mid-range',
    existingBasics: [],
    photos: {},
  };
}

// ─── Store ───────────────────────────────────────────────────────

import api from './api';

let cached: UserProfile | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Load the profile from the backend into the in-memory cache. */
export async function hydrateProfile(): Promise<UserProfile | null> {
  if (hydrated) return cached;
  try {
    const res = await api.get('/style/profile');
    if (res.data) {
      cached = res.data;
    } else {
      cached = null;
    }
  } catch {
    cached = null;
  }
  hydrated = true;
  emit();
  return cached;
}

export function getProfile(): UserProfile | null {
  return cached;
}

export function isProfileComplete(): boolean {
  return !!cached?.completedAt;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  cached = profile;
  hydrated = true;
  try {
    const res = await api.put('/style/profile', profile);
    cached = res.data;
  } catch (error) {
    console.error('Failed to save profile', error);
  }
  emit();
}

export async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
  const current = getProfile() ?? emptyProfile();
  await saveProfile({ ...current, ...updates });
}

export async function clearProfile(): Promise<void> {
  cached = null;
  hydrated = false;
  emit();
}

/** Reactive accessor — re-renders when the profile changes. */
export function useProfile(): UserProfile | null {
  const [, force] = useReducer((c) => c + 1, 0);
  useEffect(() => {
    listeners.add(force);
    void hydrateProfile();
    return () => {
      listeners.delete(force);
    };
  }, []);
  return cached;
}

// ─── Display helpers ─────────────────────────────────────────────

export const STYLE_OPTIONS: { key: StyleType; label: string; icon: string }[] = [
  { key: 'casual', label: 'Casual', icon: 'cafe-outline' },
  { key: 'smart-casual', label: 'Smart Casual', icon: 'shirt-outline' },
  { key: 'business-casual', label: 'Business Casual', icon: 'briefcase-outline' },
  { key: 'minimalist', label: 'Minimalist', icon: 'remove-outline' },
  { key: 'streetwear', label: 'Streetwear', icon: 'walk-outline' },
  { key: 'classic', label: 'Classic', icon: 'ribbon-outline' },
  { key: 'modern', label: 'Modern', icon: 'sparkles-outline' },
  { key: 'church', label: 'Church', icon: 'book-outline' },
  // { key: 'agbada', label: 'Agbada', icon: 'body-outline' },
  { key: 'athleisure', label: 'Athleisure', icon: 'bicycle-outline' },
  { key: 'preppy', label: 'Preppy', icon: 'school-outline' },
  { key: 'formal', label: 'Formal', icon: 'star-outline' },
];

export const BUDGET_OPTIONS: {
  key: BudgetRange;
  label: string;
  range: string;
  description: string;
  icon: string;
}[] = [
    {
      key: 'budget',
      label: 'Budget',
      range: 'Under $400 / outfit',
      description: 'Great value staples from accessible brands',
      icon: 'pricetag-outline',
    },
    {
      key: 'mid-range',
      label: 'Mid-range',
      range: '$400 – $800 / outfit',
      description: 'Quality pieces that balance price and longevity',
      icon: 'pricetags-outline',
    },
    {
      key: 'premium',
      label: 'Premium',
      range: '$800+ / outfit',
      description: 'Elevated, investment-grade wardrobe',
      icon: 'diamond-outline',
    },
  ];

export const COMMON_BASICS = [
  { key: 'whiteTee', label: 'White T-Shirt' },
  { key: 'darkDenim', label: 'Dark Wash Jeans' },
  { key: 'whiteSneakers', label: 'White Sneakers' },
  { key: 'navyBlazer', label: 'Navy Blazer' },
  { key: 'navyChinos', label: 'Navy Chinos' },
  { key: 'whiteOxford', label: 'White Oxford Shirt' },
];

export function styleLabel(style: StyleType): string {
  return STYLE_OPTIONS.find((s) => s.key === style)?.label ?? style;
}

export function budgetLabel(budget: BudgetRange): string {
  return BUDGET_OPTIONS.find((b) => b.key === budget)?.label ?? budget;
}

/** A short human summary of measurements for profile rows. */
export function measurementsSummary(m: Measurements): string {
  const parts: string[] = [];
  if (m.height) parts.push(`${m.height}cm`);
  if (m.weight) parts.push(`${m.weight}kg`);
  if (m.chest) parts.push(`${m.chest}cm chest`);
  return parts.length ? parts.join(' · ') : 'Not set';
}

// Auto-generated fallback default export to keep parity with other lib modules.
const _default = {} as any;
export default _default;

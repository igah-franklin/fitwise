// Core domain types for the AI Men's Style App

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMeasurements {
  id: string;
  userId: string;
  height: number; // cm
  weight: number; // kg
  waist: number; // cm
  chest: number; // cm
  shoulderWidth: number; // cm
  inseam: number; // cm
  additionalMeasurements?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface StylePreferences {
  id: string;
  userId: string;
  primaryStyle: StyleType;
  secondaryStyles: StyleType[];
  budget: BudgetRange;
  createdAt: string;
  updatedAt: string;
}

export type StyleType = 
  | 'casual' 
  | 'smart-casual' 
  | 'business-casual' 
  | 'minimalist' 
  | 'streetwear' 
  | 'classic' 
  | 'modern';

export type BudgetRange = 'budget' | 'mid-range' | 'premium';

export interface UserPhoto {
  id: string;
  userId: string;
  type: 'front' | 'side' | 'additional';
  url: string;
  uploadedAt: string;
}

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  fit: string;
  color: string;
  quantity: number;
  budgetRange: string;
  shoppingRecommendation: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export type ClothingCategory = 
  | 'tops' 
  | 'bottoms' 
  | 'outerwear' 
  | 'shoes' 
  | 'accessories';

export type ItemStatus = 'recommended' | 'owned' | 'purchased' | 'replaced';

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  occasion: OutfitOccasion;
  items: OutfitItem[];
  previewUrl?: string;
  createdAt: string;
}

export interface OutfitItem {
  id: string;
  wardrobeItemId: string;
  wardrobeItem: WardrobeItem;
}

export type OutfitOccasion = 
  | 'casual'
  | 'work'
  | 'date-night'
  | 'night-out'
  | 'travel'
  | 'wedding'
  | 'business-meeting'
  | 'vacation'
  | 'errands'
  | 'gym';

export interface OnboardingProgress {
  measurements: boolean;
  stylePreferences: boolean;
  budget: boolean;
  photos: boolean;
  wardrobe: boolean;
}

// Auto-generated fallback default export to prevent import crash
const _default = {} as any;
export default _default;

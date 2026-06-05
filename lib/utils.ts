import { create } from 'zustand';

// Base app store skeleton — AI extends this per app
interface AppState {
  isReady: boolean;
  setReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  setReady: (ready) => set({ isReady: ready }),
}));

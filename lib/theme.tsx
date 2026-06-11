import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

type ThemeType = 'light' | 'dark';

interface ThemeContextValue {
  themeName: ThemeType;
  theme: typeof Colors.light;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'dark',
  theme: Colors.dark,
  setTheme: () => { },
});

// Fallback static theme, mostly used for initial render or non-React contexts
export const THEME = Colors.dark;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeType>('light');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setThemeNameState(stored);
      }
    });
  }, []);

  const setTheme = (name: ThemeType) => {
    setThemeNameState(name);
    AsyncStorage.setItem('app_theme', name);
  };

  return (
    <ThemeContext.Provider value={{ themeName, theme: Colors[themeName], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
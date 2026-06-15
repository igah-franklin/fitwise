import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { hydrateProfile, useProfile, isProfileHydrated } from '@/lib/profile';
import { hydrateWardrobe } from '@/lib/wardrobe';
import { hydrateOutfits } from '@/lib/outfits';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

SplashScreen.preventAutoHideAsync();

interface OnboardingContextType {
  isOnboarded: boolean | null;
  setIsOnboarded: (val: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboarded: null,
  setIsOnboarded: () => {},
});

export const useOnboarded = () => useContext(OnboardingContext);

function RootApp() {
  const { theme, themeName } = useTheme();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { user, isLoading } = useAuth();

  useEffect(() => {
    const checkOnboarded = async () => {
      try {
        const onboarded = await AsyncStorage.getItem('onboarded');
        setIsOnboarded(!!onboarded);
      } catch {
        setIsOnboarded(false);
      }
    };
    checkOnboarded();
  }, []);

  useEffect(() => {
    if (user) {
      // Warm caches when user signs in
      Promise.all([hydrateProfile(), hydrateWardrobe(), hydrateOutfits()]).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isOnboarded !== null && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isOnboarded, isLoading]);

  // Hold the splash screen until fonts, onboarding state, and auth are resolved.
  if ((!fontsLoaded && !fontError) || isOnboarded === null || isLoading) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={{ isOnboarded, setIsOnboarded }}>
      <AuthGuard isOnboarded={isOnboarded} themeName={themeName} theme={theme} />
    </OnboardingContext.Provider>
  );
}

function AuthGuard({ isOnboarded, themeName, theme }: { isOnboarded: boolean, themeName: string, theme: any }) {
  const { user, isLoading } = useAuth();
  const profile = useProfile();
  // Read hydration state during render so it's part of the effect deps below.
  // Without this, a brand-new user whose profile hydrates to `null` would never
  // re-run the redirect effect (the `profile` reference stays null), letting
  // them reach the tabs without completing setup.
  const profileHydrated = isProfileHydrated();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Force onboarding for first time users before anything else
    if (!isOnboarded && segments[0] !== 'onboarding') {
      router.replace('/onboarding');
      return;
    }

    if (!user) {
      if (segments[0] !== '(auth)' && segments[0] !== 'onboarding') {
        router.replace('/(auth)/login');
      }
    } else {
      // User is authenticated — wait until we know whether they have a profile.
      if (!profileHydrated) return;

      const inAuthGroup = segments[0] === '(auth)';
      const isSetup = segments[0] === 'setup';

      // Gate everything behind a completed setup form. The collected details are
      // reused to prefill the form for future generations.
      if (!profile?.completedAt) {
        if (!isSetup) {
          router.replace('/setup');
        }
      } else {
        if (inAuthGroup || segments[0] === 'onboarding' || isSetup) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [user, isLoading, segments, isOnboarded, profile, profileHydrated]);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="outfit/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="setup" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

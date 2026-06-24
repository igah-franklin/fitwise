import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { hydrateProfile, useProfile, isProfileHydrated } from '@/lib/profile';
import { hydrateWardrobe, useWardrobe, isWardrobeHydrated } from '@/lib/wardrobe';
import { hydrateOutfits } from '@/lib/outfits';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { SubscriptionProvider } from '@/lib/subscription';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';

SplashScreen.preventAutoHideAsync();

interface OnboardingContextType {
  isOnboarded: boolean | null;
  setIsOnboarded: (val: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboarded: null,
  setIsOnboarded: () => { },
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
  const wardrobe = useWardrobe();
  // Read hydration state during render so it's part of the effect deps below.
  const profileHydrated = isProfileHydrated();
  const wardrobeHydrated = isWardrobeHydrated();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const current = segments[0];
    const hasItems = wardrobe && wardrobe.length > 0;

    console.log('[AuthGuard] State Evaluation:', {
      user: user ? user.email : null,
      current,
      profileHydrated,
      wardrobeHydrated,
      completedAt: profile?.completedAt,
      wardrobeLength: wardrobe?.length,
      hasItems
    });

    // 1. Force onboarding for first-time users
    if (!isOnboarded) {
      if (current !== 'onboarding') {
        router.replace('/onboarding');
      }
      return;
    }

    // 2. Not signed in → must be on auth screens
    if (!user) {
      if (current !== '(auth)') {
        router.replace('/(auth)/login');
      }
      return;
    }

    // 3. Signed in — wait for profile and wardrobe hydration before deciding
    if (!profileHydrated || !wardrobeHydrated) return;

    // 4. Profile not completed AND user has no wardrobe items → send to setup
    if (!profile?.completedAt && !hasItems) {
      if (current !== 'setup') {
        router.replace('/setup');
      }
      return;
    }

    // 5. Profile complete or has items — kick out of auth/onboarding/root-index only
    if (current === '(auth)' || current === 'onboarding' || !current) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, isOnboarded, profile, profileHydrated, wardrobe, wardrobeHydrated]);

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
        <Stack.Screen name="outfit/create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <PostHogProvider client={posthog}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <RootApp />
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}

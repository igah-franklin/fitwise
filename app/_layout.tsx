import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { hydrateProfile } from '@/lib/profile';
import { hydrateWardrobe } from '@/lib/wardrobe';
import { hydrateOutfits } from '@/lib/outfits';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

SplashScreen.preventAutoHideAsync();

const OnboardingContext = createContext<boolean | null>(null);

export const useOnboarded = () => useContext(OnboardingContext);

function RootApp() {
  const { theme, themeName } = useTheme();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { user } = useAuth();

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
    if (fontsLoaded && isOnboarded !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isOnboarded]);

  // Hold the splash screen until fonts and onboarding state are both resolved.
  if (!fontsLoaded || isOnboarded === null) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={isOnboarded}>
      <AuthGuard isOnboarded={isOnboarded} themeName={themeName} theme={theme} />
    </OnboardingContext.Provider>
  );
}

function AuthGuard({ isOnboarded, themeName, theme }: { isOnboarded: boolean, themeName: string, theme: any }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect away from login if authenticated
      if (isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [user, isLoading, segments, isOnboarded]);

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

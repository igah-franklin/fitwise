import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { THEME } from '@/lib/theme';
import { hydrateProfile } from '@/lib/profile';
import { hydrateWardrobe } from '@/lib/wardrobe';

SplashScreen.preventAutoHideAsync();

const OnboardingContext = createContext<boolean | null>(null);

export const useOnboarded = () => useContext(OnboardingContext);

export default function RootLayout() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    const bootstrap = async () => {
      // Warm the profile + wardrobe caches so generate flows can gate
      // synchronously on whether the user has completed setup.
      await Promise.all([hydrateProfile(), hydrateWardrobe()]);
      try {
        const onboarded = await AsyncStorage.getItem('onboarded');
        setIsOnboarded(!!onboarded);
      } catch (error) {
        // Treat error as not onboarded
        setIsOnboarded(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isOnboarded !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isOnboarded]);

  // Hold the splash screen until fonts and onboarding state are both resolved.
  // This prevents any screen from rendering before we know where to route,
  // which is what caused the onboarding flicker.
  if (!fontsLoaded || isOnboarded === null) {
    return null;
  }

  return (
    <OnboardingContext.Provider value={isOnboarded}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: THEME.background },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="outfit/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="setup" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </OnboardingContext.Provider>
  );
}

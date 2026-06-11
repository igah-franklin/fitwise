import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/theme';
import { AnimatedScreen, SlideUp, Stagger } from '@/components/ui/Motion';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function GeneratingOutfitScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  // Simple repeating pulse effect
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Screen style={styles.container}>
      <AnimatedScreen>
        <View style={styles.content}>
          <Animated.View style={[styles.pulseCircle, pulseStyle]}>
            <Text style={styles.icon}>✨</Text>
          </Animated.View>

          <SlideUp delay={200}>
            <Text style={styles.title}>
              Styling your outfit...
            </Text>
          </SlideUp>

          <SlideUp delay={400}>
            <Text style={styles.subtitle}>
              Our AI is analyzing your wardrobe and picking the best combination. This might take 10-20 seconds.
            </Text>
          </SlideUp>
        </View>
      </AnimatedScreen>
    </Screen>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    pulseCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
    },
    icon: {
      fontSize: 48,
    },
    title: {
      fontSize: 24,
      color: theme.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textDim,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

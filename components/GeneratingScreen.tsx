import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';

const ORB_SIZE = 120;
const BAR_WIDTH = 220;
const BAR_HIGHLIGHT = 90;

/**
 * A single expanding/fading ring. Each ring owns its own timeline so a set of
 * them with staggered delays reads as a continuous radar-like pulse.
 */
function PulseRing({ delay, color, size }: { delay: number; color: string; size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.ease) }), -1, false),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.55, 1.9]) }],
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.4, 0]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

interface GeneratingScreenProps {
  /** Headline shown above the cycling status steps. */
  title: string;
  /** Status lines cycled through while work is in flight. */
  steps: string[];
  /** Glyph rendered in the center orb. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Small caption under the progress bar. */
  caption?: string;
  /** How long each step is shown, in ms. Default 3000. */
  stepDurationMs?: number;
}

/**
 * Full-screen, animated "we're working on it" state. Designed to make the wait
 * feel intentional and premium: layered pulse rings, an orbiting spark around a
 * breathing gradient orb, a sweeping progress shimmer, and cycling status copy.
 */
export function GeneratingScreen({
  title,
  steps,
  icon = 'sparkles',
  caption = 'This usually takes 10–20 seconds',
  stepDurationMs = 3000,
}: GeneratingScreenProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (steps.length <= 1) return;
    const id = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, stepDurationMs);
    return () => clearInterval(id);
  }, [steps.length, stepDurationMs]);

  const spin = useSharedValue(0);
  const breathe = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.linear }), -1, false);
    breathe.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [spin, breathe, shimmer]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.07]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.35, 0.7]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.12]) }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-BAR_HIGHLIGHT, BAR_WIDTH]) },
    ],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.background, theme.primaryMuted, theme.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Orb + animated rings */}
        <View style={styles.orbArea}>
          <PulseRing delay={0} color={theme.primary} size={ORB_SIZE} />
          <PulseRing delay={650} color={theme.primary} size={ORB_SIZE} />
          <PulseRing delay={1300} color={theme.accent} size={ORB_SIZE} />

          <Animated.View style={[styles.glow, { backgroundColor: theme.primary }, glowStyle]} />

          {/* Orbiting spark */}
          <Animated.View style={[styles.orbit, orbitStyle]}>
            <View style={[styles.spark, { backgroundColor: theme.accent }]} />
          </Animated.View>

          <Animated.View style={orbStyle}>
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orb}
            >
              <Ionicons name={icon} size={46} color={theme.onPrimary} />
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={styles.title}>{title}</Text>

        {/* Cycling status line */}
        <View style={styles.stepWrap}>
          <Animated.Text
            key={stepIndex}
            entering={FadeIn.duration(500)}
            exiting={FadeOut.duration(300)}
            style={styles.stepText}
          >
            {steps[stepIndex]}
          </Animated.Text>
        </View>

        {/* Indeterminate progress bar with a sweeping highlight */}
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceElevated }]}>
          <Animated.View style={[styles.progressHighlight, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', theme.primary, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <Text style={styles.caption}>{caption}</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Purpose-specific wrappers ───────────────────────────────────

export function GeneratingOutfitScreen() {
  return (
    <GeneratingScreen
      title="Styling your outfit"
      icon="shirt"
      steps={[
        'Reading the occasion & weather…',
        'Pulling pieces from your wardrobe…',
        'Balancing colors and proportions…',
        'Rendering your lookbook shot…',
      ]}
    />
  );
}

export function GeneratingWardrobeScreen() {
  return (
    <GeneratingScreen
      title="Building your wardrobe"
      icon="sparkles"
      caption="Curating premium pieces — this can take up to a minute"
      stepDurationMs={4000}
      steps={[
        'Analyzing your style profile…',
        'Curating personalized pieces…',
        'Generating premium product shots…',
        'Finalizing your wardrobe…',
      ]}
    />
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
      paddingHorizontal: Layout.spacing.xxl,
    },
    orbArea: {
      width: 220,
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Layout.spacing.xl,
    },
    glow: {
      position: 'absolute',
      width: ORB_SIZE + 40,
      height: ORB_SIZE + 40,
      borderRadius: (ORB_SIZE + 40) / 2,
      opacity: 0.4,
    },
    orbit: {
      position: 'absolute',
      width: ORB_SIZE + 56,
      height: ORB_SIZE + 56,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    spark: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    orb: {
      width: ORB_SIZE,
      height: ORB_SIZE,
      borderRadius: ORB_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    stepWrap: {
      height: 24,
      justifyContent: 'center',
      marginBottom: Layout.spacing.xl,
    },
    stepText: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    progressTrack: {
      width: BAR_WIDTH,
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressHighlight: {
      width: BAR_HIGHLIGHT,
      height: '100%',
    },
    caption: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: Layout.spacing.lg,
    },
  });

export default GeneratingScreen;

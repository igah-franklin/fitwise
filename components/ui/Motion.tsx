import React, { useEffect } from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── AnimatedScreen ──────────────────────────────────────────────

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Initial vertical offset in px. Default: 20. */
  offset?: number;
  /** Animation duration in ms. Default: 380. */
  duration?: number;
  /** Delay before the animation starts. Default: 0. */
  delay?: number;
}

export function AnimatedScreen({ 
  children, 
  style, 
  offset = 20, 
  duration = 380, 
  delay = 0 
}: AnimatedScreenProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(offset);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [delay, duration, offset, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ─── FadeIn ──────────────────────────────────────────────────────

interface FadeInProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, style, delay = 0, duration = 320 }: FadeInProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [delay, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ─── SlideUp ─────────────────────────────────────────────────────

interface SlideUpProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  offset?: number;
}

export function SlideUp({ 
  children, 
  style, 
  delay = 0, 
  duration = 360, 
  offset = 16 
}: SlideUpProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(offset);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [delay, duration, offset, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Stagger ─────────────────────────────────────────────────────

interface StaggerProps {
  children: React.ReactNode;
  /** Delay between each child in ms. Default: 60. */
  step?: number;
  /** Delay applied to the first child in ms. Default: 0. */
  initialDelay?: number;
}

export function Stagger({ children, step = 60, initialDelay = 0 }: StaggerProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <>
      {childrenArray?.map((child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            key: child.key || index,
            delay: initialDelay + index * step,
          } as any);
        }
        return child;
      })}
    </>
  );
}

// ─── PressScale ──────────────────────────────────────────────────

interface PressScaleProps extends PressableProps {
  /** Scale factor on press. Default: 0.96. */
  scale?: number;
  /** Optional inner style applied to the pressable view. */
  style?: StyleProp<ViewStyle>;
}

export function PressScale({ 
  children, 
  style, 
  scale = 0.96, 
  ...rest 
}: PressScaleProps) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const onPressIn = () => {
    scaleValue.value = withSpring(scale, {
      damping: 15,
      stiffness: 300,
    });
  };

  const onPressOut = () => {
    scaleValue.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
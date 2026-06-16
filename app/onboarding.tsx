import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Animated as RNAnimated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable } from 'react-native';
import { ONBOARDING_SLIDES, ONBOARDING_CHROME } from '@/constants/Onboarding';
import { Text } from '@/components/ui/Text';
import { useOnboarded } from './_layout';
import { trackEvent } from '@/lib/posthog';

const { width } = Dimensions.get('window');

// Space reserved at the top/bottom of each full-height slide so the floating
// header and footer overlays don't cover the slide content.
const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 132;

interface SlideData {
  key: string;
  title: string;
  subtitle: string;
}

const slides: SlideData[] = [
  {
    key: '0',
    title: 'Build Your\nPerfect Wardrobe',
    subtitle: 'Get AI-powered recommendations tailored to your measurements, style, and budget',
  },
  {
    key: '1',
    title: 'Generate Outfits\nInstantly',
    subtitle: 'Create perfect looks for any occasion with a single tap and see how they look on you',
  },
  {
    key: '2',
    title: 'Look Your\nBest Always',
    subtitle: 'Never wonder what to wear again with personalized style intelligence',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const slideAnimation = useRef(new RNAnimated.Value(0)).current;
  const { setIsOnboarded } = useOnboarded();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
      animateSlideContent();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
      animateSlideContent();
    }
  };

  const handleComplete = async () => {
    try {
      trackEvent('onboarding_completed', { method: 'complete' });
      await AsyncStorage.setItem('onboarded', '1');
      setIsOnboarded(true);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setIsOnboarded(true);
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = async () => {
    try {
      trackEvent('onboarding_completed', { method: 'skip' });
      await AsyncStorage.setItem('onboarded', '1');
      setIsOnboarded(true);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setIsOnboarded(true);
      router.replace('/(auth)/login');
    }
  };

  const animateSlideContent = () => {
    slideAnimation.setValue(0);
    RNAnimated.parallel([
      RNAnimated.timing(slideAnimation, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const newStep = Math.round(event.nativeEvent.contentOffset.x / width);
    if (newStep !== currentStep) {
      setCurrentStep(newStep);
      animateSlideContent();
    }
  };

  React.useEffect(() => {
    animateSlideContent();
    trackEvent('onboarding_started');
  }, []);

  React.useEffect(() => {
    trackEvent('onboarding_slide_changed', { step: currentStep, title: slides[currentStep].title });
  }, [currentStep]);

  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => {
    const slide = ONBOARDING_SLIDES[index];

    const slideOpacity = slideAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const slideTranslateY = slideAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [24, 0],
    });

    return (
      <LinearGradient
        colors={slide.background}
        locations={slide.backgroundLocations}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[
          styles.slide,
          {
            width,
            paddingTop: HEADER_HEIGHT + insets.top,
            paddingBottom: FOOTER_HEIGHT + insets.bottom,
          },
        ]}
      >
        <RNAnimated.View
          style={[
            styles.slideContent,
            {
              opacity: slideOpacity,
              transform: [{ translateY: slideTranslateY }],
            },
          ]}
        >
          <View style={styles.heroSection}>
            <View style={[styles.heroHalo, { borderColor: `${slide.accentSolid}47` }]}>
              <View style={[styles.heroHaloInner, { backgroundColor: `${slide.accentSolid}21` }]}>
                <Svg width={80} height={80} viewBox="0 0 80 80">
                  {index === 0 && (
                    <Path
                      d="M40 10L45 25L60 25L48 35L53 50L40 42L27 50L32 35L20 25L35 25L40 10Z"
                      fill={slide.accentSolid}
                    />
                  )}
                  {index === 1 && (
                    <Path
                      d="M25 40C25 31.2 32.2 24 41 24H56C57.1 24 58 24.9 58 26V41C58 49.8 50.8 57 42 57H27C25.9 57 25 56.1 25 55V40ZM35 35V45H45V35H35Z"
                      fill={slide.accentSolid}
                    />
                  )}
                  {index === 2 && (
                    <Path
                      d="M20 50L25 40L35 45L45 35L55 40L60 50L50 55L40 60L30 55L20 50ZM40 45C43.3 45 46 47.7 46 51S43.3 57 40 57S34 54.3 34 51S36.7 45 40 45Z"
                      fill={slide.accentSolid}
                    />
                  )}
                </Svg>
              </View>
            </View>
          </View>

          <View style={styles.textSection}>
            <Text style={[styles.headline, { color: slide.headline }]}>
              {item.title}
            </Text>
            <Text style={[styles.subtitle, { color: slide.subtitle }]}>
              {item.subtitle}
            </Text>
          </View>
        </RNAnimated.View>
      </LinearGradient>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: ONBOARDING_SLIDES[currentStep].background[0] }]}>
      {/* Slides — each gradient fills the full screen height */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.slidesList}
      />

      {/* Header overlay */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.brand, { color: ONBOARDING_SLIDES[currentStep].accentSolid }]}>
          ✦ WearThis
        </Text>
        <Pressable onPress={handleSkip} hitSlop={10}>
          <Text style={[styles.skip, {
            color: ONBOARDING_SLIDES[currentStep].headline,
            opacity: ONBOARDING_CHROME.skipTextOpacity,
          }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Footer overlay */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides?.map((_, index) => (
            <RNAnimated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentStep
                    ? ONBOARDING_CHROME.dotActive
                    : ONBOARDING_CHROME.dotInactive,
                  width: index === currentStep ? 22 : 7,
                },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {/* Back Button */}
          <Pressable
            style={[
              styles.iconButton,
              styles.backButton,
              {
                backgroundColor: ONBOARDING_CHROME.backButtonBg,
                borderColor: ONBOARDING_CHROME.backButtonBorder,
                opacity: currentStep > 0 ? 1 : 0,
              },
              {
                shadowColor: ONBOARDING_CHROME.iconButtonShadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 8,
              },
            ]}
            onPress={handlePrevious}
            disabled={currentStep === 0}
            hitSlop={10}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={ONBOARDING_CHROME.backButtonIcon}
            />
          </Pressable>

          {/* Next/Get Started Button */}
          {currentStep < slides.length - 1 ? (
            <Pressable
              style={[
                styles.iconButton,
                {
                  shadowColor: ONBOARDING_SLIDES[currentStep].accentSolid,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.55,
                  shadowRadius: 16,
                  elevation: 10,
                },
              ]}
              onPress={handleNext}
              hitSlop={10}
            >
              <LinearGradient
                colors={ONBOARDING_SLIDES[currentStep].accent}
                style={styles.iconButtonGradient}
              >
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.getStartedButton,
                {
                  shadowColor: ONBOARDING_SLIDES[2].accentSolid,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.5,
                  shadowRadius: 18,
                  elevation: 10,
                },
              ]}
              onPress={handleComplete}
              hitSlop={10}
            >
              <LinearGradient
                colors={ONBOARDING_SLIDES[2].accent}
                style={styles.getStartedGradient}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
  },
  skip: {
    fontSize: 14,
    fontWeight: '500',
  },
  slidesList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    flex: 0.55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroHalo: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroHaloInner: {
    width: 146,
    height: 146,
    borderRadius: 73,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    flex: 0.45,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    borderWidth: 1,
  },
  iconButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedButton: {
    borderRadius: 999,
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  getStartedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
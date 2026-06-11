import React, { useState, useEffect } from 'react';
import Animated, { FadeIn, FadeOut, withRepeat, withTiming, useSharedValue, useAnimatedStyle, Easing } from 'react-native-reanimated';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PressScale } from '@/components/ui/Motion';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import {
  getProfile,
  saveProfile,
  emptyProfile,
  STYLE_OPTIONS,
  BUDGET_OPTIONS,
  COMMON_BASICS,
  type Measurements,
  type ProfilePhotos,
  type UserProfile,
} from '@/lib/profile';
import { buildWardrobe } from '@/lib/wardrobe';
import { generateOutfit } from '@/lib/outfits';
import type { BudgetRange, OutfitOccasion, StyleType } from '@/lib/types';

const STEPS = [
  { title: 'Your Measurements', subtitle: 'So every recommendation fits you exactly.' },
  { title: 'Your Style', subtitle: 'Pick the looks you want to live in.' },
  { title: 'Your Budget', subtitle: 'We tailor prices and brands to your range.' },
  { title: 'Existing Wardrobe', subtitle: 'Check off basics you already own so we don\'t recommend them again.' },
  { title: 'Your Photos', subtitle: 'Optional — preview outfits on your own body.' },
];

const MEASUREMENT_FIELDS: {
  key: keyof Measurements;
  label: string;
  unit: string;
  placeholder: string;
  required?: boolean;
}[] = [
    { key: 'height', label: 'Height', unit: 'cm', placeholder: '178', required: true },
    { key: 'weight', label: 'Weight', unit: 'kg', placeholder: '74', required: true },
    { key: 'chest', label: 'Chest', unit: 'cm', placeholder: '100', required: true },
    { key: 'waist', label: 'Waist', unit: 'cm', placeholder: '82', required: true },
    { key: 'shoulderWidth', label: 'Shoulders', unit: 'cm', placeholder: '46' },
    { key: 'inseam', label: 'Inseam', unit: 'cm', placeholder: '80' },
  ];

function GeneratingWardrobeScreen({ theme }: { theme: any }) {
  const styles = makeStyles(theme);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    'Analyzing style profile...',
    'Curating personalized pieces...',
    'Generating premium product shots...',
    'Finalizing your wardrobe...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1.5 - pulse.value,
  }));

  return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Animated.View style={[styles.pulseCircle, { backgroundColor: theme.primary }, pulseStyle]} />
      <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="sparkles" size={48} color={theme.primary} />
      </View>

      <Animated.Text entering={FadeIn.duration(500)} style={styles.loadingTitle}>
        Building your wardrobe
      </Animated.Text>

      <Animated.Text
        key={stepIndex}
        entering={FadeIn.duration(800)}
        exiting={FadeOut.duration(400)}
        style={styles.loadingText}
      >
        {steps[stepIndex]}
      </Animated.Text>
    </SafeAreaView>
  );
}

export default function SetupScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const params = useLocalSearchParams<{ occasion?: string }>();
  const existing = getProfile();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [measurements, setMeasurements] = useState<Measurements>(
    () => existing?.measurements ?? emptyProfile().measurements,
  );
  const [primaryStyle, setPrimaryStyle] = useState<StyleType>(
    existing?.primaryStyle ?? 'smart-casual',
  );
  const [secondaryStyles, setSecondaryStyles] = useState<StyleType[]>(
    existing?.secondaryStyles ?? [],
  );
  const [budget, setBudget] = useState<BudgetRange>(existing?.budget ?? 'mid-range');
  const [existingBasics, setExistingBasics] = useState<string[]>(existing?.existingBasics ?? []);
  const [photos, setPhotos] = useState<ProfilePhotos>(existing?.photos ?? {});

  const isLastStep = step === STEPS.length - 1;

  const measurementsValid = MEASUREMENT_FIELDS.filter((f) => f.required).every(
    (f) => measurements[f.key].trim().length > 0,
  );

  const updateMeasurement = (key: keyof Measurements, value: string) => {
    // digits only
    const clean = value.replace(/[^0-9]/g, '');
    setMeasurements((prev) => ({ ...prev, [key]: clean }));
  };

  const toggleBasic = (basic: string) => {
    setExistingBasics((prev) =>
      prev.includes(basic) ? prev.filter((b) => b !== basic) : [...prev, basic],
    );
  };

  const toggleSecondary = (style: StyleType) => {
    setSecondaryStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  const selectPrimary = (style: StyleType) => {
    setPrimaryStyle(style);
    // a primary style can't also be a secondary
    setSecondaryStyles((prev) => prev.filter((s) => s !== style));
  };

  const pickPhoto = async (slot: keyof ProfilePhotos) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo access so we can preview outfits on your own photos.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => ({ ...prev, [slot]: result.assets[0].uri }));
    }
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setShowErrors(false);
      setStep((s) => s - 1);
    }
  };

  const handleNext = () => {
    if (step === 0 && !measurementsValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (isLastStep) {
      void handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build the wardrobe first so the profile is only marked complete once
      // there's actually a wardrobe to shop from and generate outfits with.
      await buildWardrobe({ primaryStyle, secondaryStyles, budget, existingBasics });

      const profile: UserProfile = {
        measurements,
        primaryStyle,
        secondaryStyles,
        budget,
        existingBasics,
        photos,
        completedAt: new Date().toISOString(),
      };
      await saveProfile(profile);

      const occasion = params.occasion as OutfitOccasion | undefined;
      if (occasion) {
        const outfit = await generateOutfit(occasion);
        router.replace(`/outfit/${outfit.id}`);
      } else {
        router.replace('/(tabs)/wardrobe');
      }
    } catch (error: any) {
      setSubmitting(false);
      Alert.alert('Something went wrong', error.message || 'Please try generating your wardrobe again.');
    }
  };

  if (submitting) {
    return <GeneratingWardrobeScreen theme={theme} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <PressScale style={styles.headerButton} onPress={handleBack} hitSlop={10}>
          <Ionicons name={step === 0 ? 'close' : 'chevron-back'} size={24} color={theme.text} />
        </PressScale>
        <Text style={styles.stepCount}>
          Step {step + 1} of {STEPS.length}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              { backgroundColor: i <= step ? theme.primary : theme.surfaceElevated },
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{STEPS[step].title}</Text>
          <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>

          {/* Step 0 — Measurements */}
          {step === 0 && (
            <View style={styles.measureGrid}>
              {MEASUREMENT_FIELDS.map((field) => {
                const hasError = showErrors && field.required && !measurements[field.key].trim();
                return (
                  <Input
                    key={field.key}
                    style={styles.measureField}
                    label={`${field.label}${field.required ? '' : ' (optional)'}`}
                    value={measurements[field.key]}
                    onChangeText={(v) => updateMeasurement(field.key, v)}
                    placeholder={field.placeholder}
                    keyboardType="number-pad"
                    hint={field.unit}
                    error={hasError ? 'Required' : undefined}
                    maxLength={3}
                  />
                );
              })}
            </View>
          )}

          {/* Step 1 — Style */}
          {step === 1 && (
            <View>
              <Text style={styles.groupLabel}>Primary style</Text>
              <View style={styles.styleGrid}>
                {STYLE_OPTIONS.map((opt) => {
                  const active = primaryStyle === opt.key;
                  return (
                    <PressScale
                      key={opt.key}
                      style={[styles.styleChip, active && styles.styleChipActive]}
                      onPress={() => selectPrimary(opt.key)}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={18}
                        color={active ? theme.onPrimary : theme.primary}
                      />
                      <Text style={[styles.styleChipText, active && styles.styleChipTextActive]}>
                        {opt.label}
                      </Text>
                    </PressScale>
                  );
                })}
              </View>

              <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>
                Also into (optional)
              </Text>
              <View style={styles.styleGrid}>
                {STYLE_OPTIONS.filter((o) => o.key !== primaryStyle).map((opt) => {
                  const active = secondaryStyles.includes(opt.key);
                  return (
                    <PressScale
                      key={opt.key}
                      style={[styles.styleChipOutline, active && styles.styleChipOutlineActive]}
                      onPress={() => toggleSecondary(opt.key)}
                    >
                      <Ionicons
                        name={active ? 'checkmark' : (opt.icon as any)}
                        size={16}
                        color={active ? theme.primary : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.styleChipOutlineText,
                          active && styles.styleChipOutlineTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </PressScale>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 2 — Budget */}
          {step === 2 && (
            <View style={styles.budgetList}>
              {BUDGET_OPTIONS.map((opt) => {
                const active = budget === opt.key;
                return (
                  <PressScale key={opt.key} onPress={() => setBudget(opt.key)}>
                    <Card
                      padding="lg"
                      style={[styles.budgetCard, active && styles.budgetCardActive]}
                    >
                      <View style={styles.budgetRow}>
                        <View
                          style={[
                            styles.budgetIcon,
                            active && { backgroundColor: theme.primary },
                          ]}
                        >
                          <Ionicons
                            name={opt.icon as any}
                            size={22}
                            color={active ? theme.onPrimary : theme.primary}
                          />
                        </View>
                        <View style={styles.budgetInfo}>
                          <View style={styles.budgetHeaderRow}>
                            <Text style={styles.budgetLabel}>{opt.label}</Text>
                            <Text style={styles.budgetRange}>{opt.range}</Text>
                          </View>
                          <Text style={styles.budgetDescription}>{opt.description}</Text>
                        </View>
                        <Ionicons
                          name={active ? 'radio-button-on' : 'radio-button-off'}
                          size={22}
                          color={active ? theme.primary : theme.textMuted}
                        />
                      </View>
                    </Card>
                  </PressScale>
                );
              })}
            </View>
          )}

          {/* Step 3 — Existing Wardrobe */}
          {step === 3 && (
            <View>
              <Text style={styles.groupLabel}>Select what you already own</Text>
              <View style={styles.styleGrid}>
                {COMMON_BASICS.map((opt) => {
                  const active = existingBasics.includes(opt.key);
                  return (
                    <PressScale
                      key={opt.key}
                      style={[styles.styleChipOutline, active && styles.styleChipOutlineActive]}
                      onPress={() => toggleBasic(opt.key)}
                    >
                      <Ionicons
                        name={active ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={active ? theme.primary : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.styleChipOutlineText,
                          active && styles.styleChipOutlineTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </PressScale>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 4 — Photos */}
          {step === 4 && (
            <View style={styles.photoRow}>
              {(['front', 'side'] as const).map((slot) => {
                const uri = photos[slot];
                return (
                  <PressScale key={slot} style={styles.photoSlot} onPress={() => pickPhoto(slot)}>
                    {uri ? (
                      <>
                        <Image source={{ uri }} style={styles.photoImage} />
                        <View style={styles.photoChange}>
                          <Ionicons name="refresh" size={14} color="#fff" />
                          <Text style={styles.photoChangeText}>Change</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.photoEmpty}>
                        <Ionicons name="camera-outline" size={28} color={theme.primary} />
                        <Text style={styles.photoSlotLabel}>
                          {slot === 'front' ? 'Front photo' : 'Side photo'}
                        </Text>
                        <Text style={styles.photoSlotHint}>Tap to add</Text>
                      </View>
                    )}
                  </PressScale>
                );
              })}
            </View>
          )}

          {step === 4 && (
            <View style={styles.photoNote}>
              <Ionicons name="lock-closed-outline" size={14} color={theme.textMuted} />
              <Text style={styles.photoNoteText}>
                Photos stay on your device and are only used to preview how outfits look on you.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        {isLastStep && (
          <Pressable onPress={() => void handleSubmit()} hitSlop={8} style={styles.skipPhotos}>
            <Text style={styles.skipPhotosText}>Skip for now</Text>
          </Pressable>
        )}
        <Button
          title={isLastStep ? 'Generate My Wardrobe' : 'Continue'}
          variant="primary"
          onPress={handleNext}
          icon={
            <Ionicons
              name={isLastStep ? 'sparkles' : 'arrow-forward'}
              size={18}
              color={theme.onPrimary}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  progress: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.text,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  // Measurements
  measureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  measureField: {
    width: '48%',
    marginBottom: Layout.spacing.lg,
  },
  // Style
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: Layout.spacing.md,
  },
  groupLabelSpaced: {
    marginTop: Layout.spacing.lg,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  styleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm + 2,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  styleChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  styleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  styleChipTextActive: {
    color: theme.onPrimary,
  },
  styleChipOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  styleChipOutlineActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryMuted,
  },
  styleChipOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
  },
  styleChipOutlineTextActive: {
    color: theme.primary,
  },
  // Budget
  budgetList: {
    gap: Layout.spacing.md,
  },
  budgetCard: {
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  budgetCardActive: {
    borderColor: theme.primary,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  budgetIcon: {
    width: 46,
    height: 46,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  budgetRange: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  budgetDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  // Photos
  photoRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  photoSlot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  photoEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  photoSlotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: Layout.spacing.sm,
  },
  photoSlotHint: {
    fontSize: 12,
    color: theme.textMuted,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoChange: {
    position: 'absolute',
    bottom: Layout.spacing.sm,
    right: Layout.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.full,
  },
  photoChangeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  photoNote: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.xs,
  },
  photoNoteText: {
    flex: 1,
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 18,
  },
  // Footer
  footer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    gap: Layout.spacing.sm,
  },
  skipPhotos: {
    alignSelf: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  skipPhotosText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
  },
  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xxl,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  loadingSpinner: {
    marginBottom: Layout.spacing.lg,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: Layout.spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  pulseCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: '40%', // Adjust to be behind icon
    left: '50%',
    marginLeft: -80,
    marginTop: -80,
    opacity: 0.1,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
});

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
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PressScale } from '@/components/ui/Motion';
import { GeneratingWardrobeScreen } from '@/components/GeneratingScreen';
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
import { useSubscription } from '@/lib/subscription';
import type { BudgetRange, StyleType } from '@/lib/types';
import { trackEvent } from '@/lib/posthog';

const STEPS = [
  { title: 'Welcome to WearThis', subtitle: "Before we curate your wardrobe, let's understand you better. Here is why we need a few details:" },
  { title: 'Your Measurements', subtitle: 'So every recommendation fits you exactly.' },
  { title: 'Your Style', subtitle: 'Pick the looks you want to live in.' },
  { title: 'Your Budget', subtitle: 'We tailor prices and brands to your range.' },
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

export default function SetupScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const existing = getProfile();
  const { subscriptionTier } = useSubscription();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [gender, setGender] = useState<string>(existing?.gender ?? 'male');
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
  const [photos, setPhotos] = useState<ProfilePhotos>(existing?.photos ?? []);

  const isLastStep = step === STEPS.length - 1;

  const measurementsValid = MEASUREMENT_FIELDS.filter((f) => f.required).every(
    (f) => measurements[f.key].trim().length > 0,
  );

  useEffect(() => {
    trackEvent('profile_setup_started');
  }, []);

  useEffect(() => {
    trackEvent('profile_setup_step_changed', { step, stepTitle: STEPS[step].title });
  }, [step]);

  const updateMeasurement = (key: keyof Measurements, value: string) => {
    // digits only
    const clean = value.replace(/[^0-9]/g, '');
    setMeasurements((prev) => ({ ...prev, [key]: clean }));
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
      if (router.canGoBack()) {
        router.back();
      }
    } else {
      setShowErrors(false);
      setStep((s) => s - 1);
    }
  };

  const handleNext = () => {
    if (step === 1 && !measurementsValid) {
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
      await buildWardrobe({ primaryStyle, secondaryStyles, budget });

      const profile: UserProfile = {
        measurements,
        primaryStyle,
        secondaryStyles,
        budget,
        photos,
        gender,
        completedAt: new Date().toISOString(),
      };
      await saveProfile(profile);

      trackEvent('profile_setup_completed', {
        gender,
        primaryStyle,
        secondaryStylesCount: secondaryStyles.length,
        budget,
        hasPhotos: photos.length > 0,
      });

      // After a successful wardrobe generation, always land the user on the
      // wardrobe tab so they see the pieces that were just created.
      router.replace('/(tabs)/wardrobe');
    } catch (error: any) {
      setSubmitting(false);
      trackEvent('profile_setup_failed', { error: error.message || 'unknown' });
      const errMsg = (error.message || '').toLowerCase();
      if (errMsg.includes('limit') || errMsg.includes('exceeded') || errMsg.includes('403')) {
        Alert.alert(
          'Limit Reached',
          'You have reached your limit of wardrobe item generations for this month. Upgrade to Pro or Premium to generate your wardrobe!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => router.push('/paywall') }
          ]
        );
      } else if (errMsg.match(/quota|429|503|demand|unavailable|busy|temporary/)) {
        Alert.alert(
          'High Traffic',
          "We're experiencing high traffic with our provider. Please try again in a few moments."
        );
      } else {
        Alert.alert('Something went wrong', error.message || 'Please try generating your wardrobe again.');
      }
    }
  };

  if (submitting) {
    return <GeneratingWardrobeScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {step > 0 || router.canGoBack() ? (
          <PressScale style={styles.headerButton} onPress={handleBack} hitSlop={10}>
            <Ionicons name={step === 0 ? 'close' : 'chevron-back'} size={24} color={theme.text} />
          </PressScale>
        ) : (
          <View style={styles.headerButton} />
        )}
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
          {step !== 0 && <Text style={styles.title}>{STEPS[step].title}</Text>}
          {step !== 0 && <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>}

          {/* Step 0 — Introduction */}
          {step === 0 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.introContainer}>
              <View style={styles.introIconContainer}>
                <Ionicons name="sparkles" size={48} color={theme.primary} />
              </View>
              <Text style={styles.introHeadline}>{STEPS[step].title}</Text>
              <Text style={styles.introBody}>{STEPS[step].subtitle}</Text>

              <View style={styles.introFeatureList}>
                <View style={styles.introFeatureItem}>
                  <View style={styles.introFeatureIconWrapper}>
                    <Ionicons name="body-outline" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.introFeatureTextWrapper}>
                    <Text style={styles.introFeatureTitle}>Measurements</Text>
                    <Text style={styles.introFeatureDesc}>For clothes that fit your unique body shape perfectly</Text>
                  </View>
                </View>

                <View style={styles.introFeatureItem}>
                  <View style={styles.introFeatureIconWrapper}>
                    <Ionicons name="shirt-outline" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.introFeatureTextWrapper}>
                    <Text style={styles.introFeatureTitle}>Style & Vibe</Text>
                    <Text style={styles.introFeatureDesc}>To match your personal aesthetic and lifestyle</Text>
                  </View>
                </View>

                <View style={styles.introFeatureItem}>
                  <View style={styles.introFeatureIconWrapper}>
                    <Ionicons name="wallet-outline" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.introFeatureTextWrapper}>
                    <Text style={styles.introFeatureTitle}>Budget Range</Text>
                    <Text style={styles.introFeatureDesc}>To recommend pieces that make sense for your wallet</Text>
                  </View>
                </View>

                <View style={styles.introFeatureItem}>
                  <View style={styles.introFeatureIconWrapper}>
                    <Ionicons name="camera-outline" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.introFeatureTextWrapper}>
                    <Text style={styles.introFeatureTitle}>Photos (Optional)</Text>
                    <Text style={styles.introFeatureDesc}>To visualize outfits on your own body</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Step 1 — Measurements */}
          {step === 1 && (
            <View>
              <Text style={styles.groupLabel}>Gender</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                {['male', 'female'].map(g => (
                  <PressScale
                    key={g}
                    style={[
                      styles.styleChip,
                      { flex: 1, paddingVertical: 12, justifyContent: 'center' },
                      gender === g && styles.styleChipActive
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[
                      styles.styleChipText,
                      { fontSize: 14, textTransform: 'capitalize' },
                      gender === g && styles.styleChipTextActive
                    ]}>
                      {g}
                    </Text>
                  </PressScale>
                ))}
              </View>

              <Text style={styles.groupLabel}>Measurements</Text>
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
            </View>
          )}

          {/* Step 2 — Style */}
          {step === 2 && (
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

          {/* Step 3 — Budget */}
          {step === 3 && (
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



        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
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
  photoSlotText: {
    marginTop: Layout.spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'capitalize',
  },
  introContainer: {
    paddingTop: Layout.spacing.sm,
    alignItems: 'center',
  },
  introIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  introHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  introBody: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  introFeatureList: {
    width: '100%',
    gap: Layout.spacing.md,
  },
  introFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  introFeatureIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  introFeatureTextWrapper: {
    flex: 1,
  },
  introFeatureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  introFeatureDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
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

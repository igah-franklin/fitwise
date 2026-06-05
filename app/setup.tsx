import React, { useState } from 'react';
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
import { THEME } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import {
  getProfile,
  saveProfile,
  emptyProfile,
  STYLE_OPTIONS,
  BUDGET_OPTIONS,
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

export default function SetupScreen() {
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
      await buildWardrobe({ primaryStyle, secondaryStyles, budget });

      const profile: UserProfile = {
        measurements,
        primaryStyle,
        secondaryStyles,
        budget,
        photos,
        completedAt: new Date().toISOString(),
      };
      await saveProfile(profile);

      const occasion = params.occasion as OutfitOccasion | undefined;
      if (occasion) {
        const outfit = generateOutfit(occasion);
        router.replace(`/outfit/${outfit.id}`);
      } else {
        router.replace('/(tabs)/wardrobe');
      }
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Something went wrong', 'Please try generating your wardrobe again.');
    }
  };

  if (submitting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingIcon}>
            <Ionicons name="sparkles" size={36} color={THEME.primary} />
          </View>
          <ActivityIndicator size="large" color={THEME.primary} style={styles.loadingSpinner} />
          <Text style={styles.loadingTitle}>Building your wardrobe</Text>
          <Text style={styles.loadingText}>
            Matching pieces to your measurements, style and budget…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <PressScale style={styles.headerButton} onPress={handleBack} hitSlop={10}>
          <Ionicons name={step === 0 ? 'close' : 'chevron-back'} size={24} color={THEME.text} />
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
              { backgroundColor: i <= step ? THEME.primary : THEME.surfaceElevated },
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
                        color={active ? THEME.onPrimary : THEME.primary}
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
                        color={active ? THEME.primary : THEME.textMuted}
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
                            active && { backgroundColor: THEME.primary },
                          ]}
                        >
                          <Ionicons
                            name={opt.icon as any}
                            size={22}
                            color={active ? THEME.onPrimary : THEME.primary}
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
                          color={active ? THEME.primary : THEME.textMuted}
                        />
                      </View>
                    </Card>
                  </PressScale>
                );
              })}
            </View>
          )}

          {/* Step 3 — Photos */}
          {step === 3 && (
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
                        <Ionicons name="camera-outline" size={28} color={THEME.primary} />
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

          {step === 3 && (
            <View style={styles.photoNote}>
              <Ionicons name="lock-closed-outline" size={14} color={THEME.textMuted} />
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
              color={THEME.onPrimary}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
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
    color: THEME.textSecondary,
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
    color: THEME.text,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.textSecondary,
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
    color: THEME.text,
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
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  styleChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  styleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  styleChipTextActive: {
    color: THEME.onPrimary,
  },
  styleChipOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  styleChipOutlineActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryMuted,
  },
  styleChipOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  styleChipOutlineTextActive: {
    color: THEME.primary,
  },
  // Budget
  budgetList: {
    gap: Layout.spacing.md,
  },
  budgetCard: {
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  budgetCardActive: {
    borderColor: THEME.primary,
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
    backgroundColor: THEME.primaryMuted,
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
    color: THEME.text,
  },
  budgetRange: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.primary,
  },
  budgetDescription: {
    fontSize: 13,
    color: THEME.textSecondary,
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
    backgroundColor: THEME.surface,
    borderWidth: 1.5,
    borderColor: THEME.border,
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
    color: THEME.text,
    marginTop: Layout.spacing.sm,
  },
  photoSlotHint: {
    fontSize: 12,
    color: THEME.textMuted,
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
    color: THEME.textMuted,
    lineHeight: 18,
  },
  // Footer
  footer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.divider,
    gap: Layout.spacing.sm,
  },
  skipPhotos: {
    alignSelf: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  skipPhotosText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textMuted,
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
    backgroundColor: THEME.primaryMuted,
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
    color: THEME.text,
    marginBottom: Layout.spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

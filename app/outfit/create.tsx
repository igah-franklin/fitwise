import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Alert, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { generateOutfit } from '@/lib/outfits';
import type { OutfitOccasion } from '@/lib/types';
import { GeneratingOutfitScreen } from '@/components/GeneratingOutfitScreen';
import { useSubscription } from '@/lib/subscription';
import { useProfile } from '@/lib/profile';

const { width } = Dimensions.get('window');
const cardWidth = (width - Layout.spacing.lg * 3) / 2;

const occasions: { key: OutfitOccasion; label: string; icon: string }[] = [
  { key: 'casual', label: 'Casual', icon: 'cafe-outline' },
  { key: 'work', label: 'Work', icon: 'briefcase-outline' },
  { key: 'date-night', label: 'Date Night', icon: 'heart-outline' },
  { key: 'night-out', label: 'Night Out', icon: 'beer-outline' },
  { key: 'travel', label: 'Travel', icon: 'airplane-outline' },
  { key: 'wedding', label: 'Wedding', icon: 'star-outline' },
  { key: 'business-meeting', label: 'Meeting', icon: 'people-outline' },
  { key: 'vacation', label: 'Vacation', icon: 'boat-outline' },
  { key: 'errands', label: 'Errands', icon: 'cart-outline' },
  { key: 'gym', label: 'Gym', icon: 'fitness-outline' },
];

export default function CreateOutfitScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { usage, subscriptionTier, refreshSubscription } = useSubscription();
  const profile = useProfile();
  const hasSavedPhotos = !!(profile?.photos?.front || profile?.photos?.side);

  const [step, setStep] = useState<0 | 1>(0);
  const [selectedOccasion, setSelectedOccasion] = useState<OutfitOccasion | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePickImage = async (useCamera: boolean) => {
    let permission;
    if (useCamera) {
      permission = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permission.granted) {
      Alert.alert(
        'Permission Denied',
        `Please allow ${useCamera ? 'camera' : 'photo library'} permissions to upload your picture.`
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;

      // Validate file size (limit to 5MB on frontend)
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          const sizeInMb = fileInfo.size / (1024 * 1024);
          const maxSizeMb = 5;
          if (sizeInMb > maxSizeMb) {
            Alert.alert(
              'Image Too Large',
              `The selected image is ${sizeInMb.toFixed(1)}MB, which exceeds the limit of ${maxSizeMb}MB. Please select a smaller photo.`
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to get file info:', err);
      }

      setPhoto(uri);
    }
  };

  const handleNextStep = () => {
    if (!selectedOccasion) return;
    setStep(1);
  };

  const handleGenerate = async () => {
    if (!selectedOccasion) return;

    // Check usage limits locally first
    if (usage && usage.outfit.limit !== -1 && usage.outfit.remaining <= 0) {
      Alert.alert(
        'Limit Reached',
        'You have reached your limit of outfit generations for this month. Upgrade to Pro or Elite to generate more outfits!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Now', onPress: () => router.push('/paywall') }
        ]
      );
      return;
    }

    setIsGenerating(true);

    try {
      let base64Photo: string | undefined;
      if (photo) {
        base64Photo = await FileSystem.readAsStringAsync(photo, {
          encoding: 'base64',
        });
      }

      const newOutfit = await generateOutfit(selectedOccasion, base64Photo);
      await refreshSubscription();
      setIsGenerating(false);
      
      // Navigate to outfit details
      router.replace(`/outfit/${newOutfit.id}`);
    } catch (error: any) {
      setIsGenerating(false);
      
      const errMsg = (error.message || '').toLowerCase();
      
      // Face detection failure
      if (errMsg.includes('face verification failed') || errMsg.includes('400')) {
        Alert.alert(
          'Face Verification Failed',
          error.message || 'We could not detect a human face in the photo. Please upload a clear selfie or portrait shot, or skip the photo step.',
          [
            { text: 'Try Another Photo', style: 'default' },
            { 
              text: 'Generate Without Photo', 
              onPress: async () => {
                setPhoto(null);
                // retry generation without photo
                setIsGenerating(true);
                try {
                  const newOutfit = await generateOutfit(selectedOccasion);
                  await refreshSubscription();
                  setIsGenerating(false);
                  router.replace(`/outfit/${newOutfit.id}`);
                } catch (err: any) {
                  setIsGenerating(false);
                  const innerMsg = (err.message || '').toLowerCase();
                  if (innerMsg.includes('limit') || innerMsg.includes('exceeded') || innerMsg.includes('403')) {
                    Alert.alert(
                      'Limit Reached',
                      'You have reached your limit of outfit generations for this month. Upgrade to Pro or Premium to generate more outfits!',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Upgrade Now', onPress: () => router.push('/paywall') }
                      ]
                    );
                  } else if (innerMsg.match(/quota|429|503|demand|unavailable|busy|temporary/)) {
                    Alert.alert(
                      'High Traffic',
                      "We're experiencing high traffic with our provider. Please try again in a few moments."
                    );
                  } else {
                    Alert.alert('Error', err.message || 'Failed to generate outfit.');
                  }
                }
              }
            }
          ]
        );
      } else if (errMsg.includes('limit') || errMsg.includes('exceeded') || errMsg.includes('403')) {
        Alert.alert(
          'Limit Reached',
          'You have reached your limit of outfit generations for this month. Upgrade to Pro or Premium to generate more outfits!',
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
        Alert.alert('Generation Error', error.message || 'Failed to generate outfit. Please try again.');
      }
    }
  };

  if (isGenerating) {
    return <GeneratingOutfitScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressScale
          style={styles.headerButton}
          onPress={() => {
            if (step === 1) {
              setStep(0);
            } else {
              router.back();
            }
          }}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </PressScale>
        <Text style={styles.headerTitle}>
          {step === 0 ? 'Choose Occasion' : 'Add Face (Optional)'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AnimatedScreen>
          {step === 0 ? (
            <Stagger step={60} initialDelay={100}>
              <SlideUp>
                <Text variant="h2" style={styles.title}>Where are you going?</Text>
                <Text variant="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Select an occasion to let our AI build the perfect styling recommendation.
                </Text>
              </SlideUp>

              <SlideUp>
                <View style={styles.grid}>
                  {occasions.map((occ) => {
                    const active = selectedOccasion === occ.key;
                    return (
                      <PressScale
                        key={occ.key}
                        onPress={() => setSelectedOccasion(occ.key)}
                        style={[
                          styles.chip,
                          active && {
                            backgroundColor: theme.primary,
                            borderColor: theme.primary,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.chipIconContainer,
                            active && { backgroundColor: 'rgba(255,255,255,0.25)' },
                          ]}
                        >
                          <Ionicons
                            name={occ.icon as any}
                            size={20}
                            color={active ? theme.onPrimary : theme.primary}
                          />
                        </View>
                        <Text style={[styles.chipText, active && { color: theme.onPrimary }]}>
                          {occ.label}
                        </Text>
                      </PressScale>
                    );
                  })}
                </View>
              </SlideUp>
            </Stagger>
          ) : (
            <Stagger step={60} initialDelay={100}>
              <SlideUp>
                <Text variant="h2" style={styles.title}>Visualize on Yourself</Text>
                <Text variant="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Upload a portrait photo to see the outfit generated directly onto your likeness. Otherwise, we'll generate it on a mannequin.
                </Text>
              </SlideUp>

              <SlideUp>
                {photo ? (
                  <Card style={styles.previewCard}>
                    <Image source={{ uri: photo }} style={styles.previewImage} />
                    <View style={styles.photoActions}>
                      <Button
                        title="Change Photo"
                        variant="outline"
                        size="sm"
                        onPress={() => handlePickImage(false)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Remove"
                        variant="ghost"
                        size="sm"
                        onPress={() => setPhoto(null)}
                        textStyle={{ color: theme.danger }}
                      />
                    </View>
                  </Card>
                ) : (
                  <View>
                    {hasSavedPhotos && (
                      <View style={{ marginBottom: Layout.spacing.lg }}>
                        <Text style={styles.savedPortraitsHeader}>
                          Select from Saved Portraits:
                        </Text>
                        <View style={styles.savedRow}>
                          {profile?.photos?.front && (
                            <PressScale
                              style={[
                                styles.savedThumbnailWrapper,
                                photo === profile.photos.front && styles.activeThumbnail
                              ]}
                              onPress={() => setPhoto(profile.photos.front!)}
                            >
                              <Image source={{ uri: profile.photos.front }} style={styles.savedThumbnail} />
                              <Text style={styles.thumbnailLabel}>Front View</Text>
                            </PressScale>
                          )}
                          {profile?.photos?.side && (
                            <PressScale
                              style={[
                                styles.savedThumbnailWrapper,
                                photo === profile.photos.side && styles.activeThumbnail
                              ]}
                              onPress={() => setPhoto(profile.photos.side!)}
                            >
                              <Image source={{ uri: profile.photos.side }} style={styles.savedThumbnail} />
                              <Text style={styles.thumbnailLabel}>Side View</Text>
                            </PressScale>
                          )}
                        </View>
                        <Text style={styles.orDivider}>
                          — OR UPLOAD NEW —
                        </Text>
                      </View>
                    )}

                    <View style={styles.slotsRow}>
                      <PressScale style={styles.slot} onPress={() => handlePickImage(false)}>
                        <Ionicons name="image-outline" size={36} color={theme.primary} />
                        <Text style={styles.slotLabel}>Photo Library</Text>
                      </PressScale>

                      <PressScale style={styles.slot} onPress={() => handlePickImage(true)}>
                        <Ionicons name="camera-outline" size={36} color={theme.primary} />
                        <Text style={styles.slotLabel}>Take Photo</Text>
                      </PressScale>
                    </View>
                  </View>
                )}
              </SlideUp>

              <SlideUp>
                <View style={styles.infoNote}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={theme.textMuted} />
                  <Text variant="caption" style={{ color: theme.textMuted, flex: 1, marginLeft: 6 }}>
                    Your photo is secure. It is analyzed temporarily for face features and is never shared or sold.
                  </Text>
                </View>
              </SlideUp>
            </Stagger>
          )}
        </AnimatedScreen>
      </ScrollView>

      {/* Footer CTA Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step === 0 ? (
          <Button
            title="Continue"
            variant="primary"
            disabled={!selectedOccasion}
            onPress={handleNextStep}
            icon={<Ionicons name="arrow-forward" size={18} color={theme.onPrimary} />}
          />
        ) : (
          <View style={styles.footerButtons}>
            <Button
              title="Generate Outfit"
              variant="primary"
              onPress={handleGenerate}
              style={{ flex: 1 }}
              icon={<Ionicons name="color-wand-outline" size={18} color={theme.onPrimary} />}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: 100,
  },
  title: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
    minWidth: '48%',
    flex: 1,
  },
  chipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  previewCard: {
    overflow: 'hidden',
    padding: 0,
    marginBottom: Layout.spacing.lg,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: theme.surfaceElevated,
  },
  photoActions: {
    flexDirection: 'row',
    padding: Layout.spacing.md,
    backgroundColor: theme.surface,
    gap: Layout.spacing.md,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  slot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    gap: 8,
  },
  slotLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.textSecondary,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surfaceElevated,
    padding: 12,
    borderRadius: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: Layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(259, 259, 259, 0.05)',
    backgroundColor: theme.background,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  savedPortraitsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  savedRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  savedThumbnailWrapper: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.border,
    overflow: 'hidden',
    backgroundColor: theme.surface,
  },
  activeThumbnail: {
    borderColor: theme.primary,
    borderWidth: 2,
  },
  savedThumbnail: {
    width: '100%',
    height: 90,
    backgroundColor: theme.surfaceElevated,
  },
  thumbnailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
    paddingVertical: 2,
  },
  orDivider: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    textAlign: 'center',
    marginVertical: Layout.spacing.md,
    letterSpacing: 1,
  },
});

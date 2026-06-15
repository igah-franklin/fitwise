import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { useProfile, updateProfile } from '@/lib/profile';

export default function PhotosScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const profile = useProfile();
  
  const [uploading, setUploading] = useState<{ front: boolean; side: boolean }>({
    front: false,
    side: false,
  });

  const handlePickImage = async (type: 'front' | 'side', useCamera: boolean) => {
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

      setUploading((prev) => ({ ...prev, [type]: true }));

      try {
        // Read file as base64
        const base64Photo = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });

        // Update profile (sends to backend PUT /style/profile which validates & uploads to S3)
        const currentPhotos = profile?.photos || {};
        await updateProfile({
          photos: {
            ...currentPhotos,
            [type]: `data:image/jpeg;base64,${base64Photo}`,
          },
        });

        Alert.alert('Success', `${type === 'front' ? 'Front' : 'Side'} photo uploaded and validated successfully!`);
      } catch (error: any) {
        console.error('Upload failed:', error);
        Alert.alert('Upload Failed', error.message || 'Failed to validate and upload your photo. Please make sure a clear human face is visible.');
      } finally {
        setUploading((prev) => ({ ...prev, [type]: false }));
      }
    }
  };

  const handleRemovePhoto = (type: 'front' | 'side') => {
    Alert.alert(
      'Remove Photo',
      `Are you sure you want to remove your ${type === 'front' ? 'Front' : 'Side'} photo?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            if (profile) {
              setUploading((prev) => ({ ...prev, [type]: true }));
              try {
                const currentPhotos = { ...profile.photos };
                currentPhotos[type] = '';
                await updateProfile({ photos: currentPhotos });
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to remove photo.');
              } finally {
                setUploading((prev) => ({ ...prev, [type]: false }));
              }
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressScale style={styles.headerButton} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </PressScale>
        <Text style={styles.headerTitle}>My Photos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AnimatedScreen>
          <Stagger step={70} initialDelay={100}>
            <SlideUp>
              <Text style={styles.sectionTitle}>Model Likeness Portraits</Text>
              <Text style={styles.sectionSubtitle}>
                Upload high-quality portraits to generate outfit combinations directly onto your likeness. Every upload is automatically validated to ensure face features are clearly visible.
              </Text>
            </SlideUp>

            {/* Front Photo Slot */}
            <SlideUp>
              <Card style={styles.photoContainerCard} padding="lg">
                <Text style={styles.cardHeaderTitle}>Front View Portrait</Text>
                <Text style={styles.cardHeaderSubtitle}>Best for standard outfit generation.</Text>

                {uploading.front ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>Verifying face and saving...</Text>
                  </View>
                ) : profile?.photos?.front ? (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: profile.photos.front }} style={styles.slotImage} />
                    <PressScale style={styles.removeBadge} onPress={() => handleRemovePhoto('front')}>
                      <Ionicons name="trash" size={18} color="#fff" />
                    </PressScale>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <PressScale style={styles.actionSlot} onPress={() => handlePickImage('front', false)}>
                      <Ionicons name="image" size={24} color={theme.primary} />
                      <Text style={styles.actionLabel}>Upload Photo</Text>
                    </PressScale>

                    <PressScale style={styles.actionSlot} onPress={() => handlePickImage('front', true)}>
                      <Ionicons name="camera" size={24} color={theme.primary} />
                      <Text style={styles.actionLabel}>Take Photo</Text>
                    </PressScale>
                  </View>
                )}
              </Card>
            </SlideUp>

            {/* Side Photo Slot */}
            <SlideUp>
              <Card style={styles.photoContainerCard} padding="lg">
                <Text style={styles.cardHeaderTitle}>Side View Portrait</Text>
                <Text style={styles.cardHeaderSubtitle}>Helps map secondary fitting angles.</Text>

                {uploading.side ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>Verifying face and saving...</Text>
                  </View>
                ) : profile?.photos?.side ? (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: profile.photos.side }} style={styles.slotImage} />
                    <PressScale style={styles.removeBadge} onPress={() => handleRemovePhoto('side')}>
                      <Ionicons name="trash" size={18} color="#fff" />
                    </PressScale>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <PressScale style={styles.actionSlot} onPress={() => handlePickImage('side', false)}>
                      <Ionicons name="image" size={24} color={theme.primary} />
                      <Text style={styles.actionLabel}>Upload Photo</Text>
                    </PressScale>

                    <PressScale style={styles.actionSlot} onPress={() => handlePickImage('side', true)}>
                      <Ionicons name="camera" size={24} color={theme.primary} />
                      <Text style={styles.actionLabel}>Take Photo</Text>
                    </PressScale>
                  </View>
                )}
              </Card>
            </SlideUp>
          </Stagger>
        </AnimatedScreen>
      </ScrollView>
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
    paddingBottom: Layout.spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
    marginBottom: Layout.spacing.xl,
    lineHeight: 20,
  },
  photoContainerCard: {
    marginBottom: Layout.spacing.lg,
    backgroundColor: theme.surface,
  },
  cardHeaderTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.text,
  },
  cardHeaderSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: Layout.spacing.md,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surfaceElevated,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: Layout.spacing.sm,
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  slotImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: theme.surfaceElevated,
  },
  removeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  actionSlot: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceElevated,
    gap: 8,
  },
  actionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: theme.textSecondary,
  },
});

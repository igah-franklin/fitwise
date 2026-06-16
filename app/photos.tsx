import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { useProfile, updateProfile } from '@/lib/profile';

const { width } = Dimensions.get('window');

export default function PhotosScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const profile = useProfile();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [uploading, setUploading] = useState(false);

  const cameraRef = React.useRef<CameraView>(null);

  const portraits = Array.isArray(profile?.photos) ? profile.photos : [];

  const handleStartCamera = async () => {
    if (portraits.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos.');
      return;
    }

    if (!cameraPermission || !cameraPermission.granted) {
      const status = await requestCameraPermission();
      if (!status.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take a selfie.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCaptureSelfie = async () => {
    if (cameraRef.current) {
      try {
        setUploading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        if (photo && photo.base64) {
          setShowCamera(false);
          await handleSavePhoto(`data:image/jpeg;base64,${photo.base64}`);
        } else {
          Alert.alert('Capture Failed', 'Could not capture photo data.');
          setUploading(false);
        }
      } catch (err: any) {
        console.error('Camera capture error:', err);
        Alert.alert('Capture Error', err.message || 'An error occurred while taking the picture.');
        setUploading(false);
      }
    }
  };

  const handlePickImage = async () => {
    if (portraits.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Media library access is required to upload a portrait.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

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

      setUploading(true);
      try {
        const base64Photo = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        await handleSavePhoto(`data:image/jpeg;base64,${base64Photo}`);
      } catch (err: any) {
        console.error('Pick image error:', err);
        Alert.alert('Upload Error', err.message || 'An error occurred during file read.');
        setUploading(false);
      }
    }
  };

  const handleSavePhoto = async (base64Photo: string) => {
    setUploading(true);
    try {
      const updatedPhotos = [...portraits, base64Photo];
      await updateProfile({
        photos: updatedPhotos,
      });
      Alert.alert('Success', 'Selfie uploaded and verified successfully!');
    } catch (error: any) {
      console.error('Save failed:', error);
      Alert.alert(
        'Verification Failed',
        error.message || 'Failed to validate and upload your photo. Please make sure a clear human face is visible.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (photoUrl: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this selfie?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedPhotos = portraits.filter((url) => url !== photoUrl);
            setUploading(true);
            try {
              await updateProfile({ photos: updatedPhotos });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove photo.');
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={StyleSheet.absoluteFill} facing={cameraFacing} ref={cameraRef} />
        <View style={styles.cameraOverlay}>
          {/* Camera Header */}
          <View style={styles.cameraHeader}>
            <PressScale onPress={() => setShowCamera(false)} style={styles.cameraCloseBtn}>
              <Ionicons name="close" size={26} color="#fff" />
            </PressScale>
            <Text style={styles.cameraHeaderTitle}>Fit Selfie</Text>
            <PressScale
              onPress={() => setCameraFacing((f) => (f === 'front' ? 'back' : 'front'))}
              style={styles.cameraCloseBtn}
            >
              <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
            </PressScale>
          </View>

          {/* Centered Guide Viewfinder Area */}
          <View style={styles.guideBoxContainer}>
            <View style={styles.viewfinder}>
              {/* Nice white corner brackets at the edges */}
              <View style={[styles.cornerBracket, { top: 0, left: 0, borderLeftWidth: 4, borderTopWidth: 4 }]} />
              <View style={[styles.cornerBracket, { top: 0, right: 0, borderRightWidth: 4, borderTopWidth: 4 }]} />
              <View style={[styles.cornerBracket, { bottom: 0, left: 0, borderLeftWidth: 4, borderBottomWidth: 4 }]} />
              <View style={[styles.cornerBracket, { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4 }]} />

              {/* Face Guide Oval */}
              <View style={styles.faceGuideOval} />
            </View>
          </View>

          {/* Camera Footer / Capture Control */}
          <View style={styles.cameraFooter}>
            <Text style={styles.cameraFooterText}>Ensure good lighting and fit face inside the oval</Text>
            <PressScale onPress={handleCaptureSelfie} style={styles.captureBtnOuter}>
              <View style={styles.captureBtnInner} />
            </PressScale>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressScale style={styles.headerButton} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </PressScale>
        <Text style={styles.headerTitle}>My Portraits</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AnimatedScreen style={{ flex: 1 }}>
          <Stagger step={70} initialDelay={100}>
            <SlideUp>
              <Text style={styles.sectionTitle}>Model Likeness Selfies</Text>
              <Text style={styles.sectionSubtitle}>
                Add up to 5 portrait selfies to generate clothing recommendations directly onto your likeness. Every selfie is validated to ensure facial features are clearly visible.
              </Text>
            </SlideUp>

            {/* Dashboard / Control Card */}
            <SlideUp>
              <Card style={styles.controlCard} padding="lg">
                <Text style={styles.controlTitle}>Add New Selfie</Text>
                <Text style={styles.controlSubtitle}>
                  Portraits count: {portraits.length} / 5
                </Text>

                {uploading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>Verifying face and saving...</Text>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <PressScale
                      style={[styles.actionSlot, portraits.length >= 5 && styles.actionSlotDisabled]}
                      onPress={handlePickImage}
                      disabled={portraits.length >= 5}
                    >
                      <Ionicons name="image" size={24} color={portraits.length >= 5 ? theme.textMuted : theme.primary} />
                      <Text style={styles.actionLabel}>Upload Photo</Text>
                    </PressScale>

                    <PressScale
                      style={[styles.actionSlot, portraits.length >= 5 && styles.actionSlotDisabled]}
                      onPress={handleStartCamera}
                      disabled={portraits.length >= 5}
                    >
                      <Ionicons name="camera" size={24} color={portraits.length >= 5 ? theme.textMuted : theme.primary} />
                      <Text style={styles.actionLabel}>Take Selfie</Text>
                    </PressScale>
                  </View>
                )}
              </Card>
            </SlideUp>

            {/* Selfies Grid */}
            <SlideUp>
              <Text style={styles.sectionTitleGrid}>Uploaded Portrait Selfies</Text>
              <View style={styles.gridContainer}>
                {portraits.map((photoUrl, index) => (
                  <View key={photoUrl} style={styles.gridItem}>
                    <Image source={{ uri: photoUrl }} style={styles.gridImage} />
                    <PressScale
                      style={styles.deleteBadge}
                      onPress={() => handleRemovePhoto(photoUrl)}
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                    </PressScale>
                    <View style={styles.portraitNumber}>
                      <Text style={styles.portraitNumberText}>Selfie {index + 1}</Text>
                    </View>
                  </View>
                ))}

                {portraits.length === 0 && !uploading && (
                  <Card style={styles.emptyCard} padding="lg">
                    <Ionicons name="camera-outline" size={36} color={theme.textMuted} style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyCardText}>No selfies uploaded yet.</Text>
                    <Text style={styles.emptyCardSubtext}>Take a selfie or upload one from your library to start visualizing outfits on your likeness.</Text>
                  </Card>
                )}
              </View>
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
  sectionTitleGrid: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
    marginBottom: Layout.spacing.lg,
    lineHeight: 20,
  },
  controlCard: {
    marginBottom: Layout.spacing.lg,
    backgroundColor: theme.surface,
  },
  controlTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.text,
  },
  controlSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: Layout.spacing.md,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surfaceElevated,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: Layout.spacing.sm,
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  actionSlot: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceElevated,
    gap: 8,
  },
  actionSlotDisabled: {
    opacity: 0.5,
    backgroundColor: theme.surface,
  },
  actionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: theme.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xxl,
  },
  gridItem: {
    width: (width - Layout.spacing.lg * 2 - Layout.spacing.md) / 2,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.surfaceElevated,
  },
  deleteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  portraitNumber: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  portraitNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: Layout.spacing.xl,
  },
  emptyCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  emptyCardSubtext: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Layout.spacing.lg,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    height: 110,
  },
  cameraHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cameraCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBoxContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: width * 0.75,
    aspectRatio: 3 / 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBracket: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#ffffff',
  },
  faceGuideOval: {
    width: width * 0.48,
    aspectRatio: 3 / 4,
    borderRadius: (width * 0.48) / 2,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
    opacity: 0.85,
  },
  cameraFooter: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cameraFooterText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  captureBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
});

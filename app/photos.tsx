import React from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { EmptyState } from '@/components/layout/EmptyState';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { useProfile, updateProfile } from '@/lib/profile';

export default function PhotosScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const profile = useProfile();
  
  const handleRemovePhoto = (type: 'front' | 'side') => {
    Alert.alert(
      'Remove Photo',
      `Are you sure you want to remove your ${type} photo?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            if (profile) {
              const newPhotos = { ...profile.photos };
              delete newPhotos[type];
              updateProfile({ photos: newPhotos });
            }
          }
        },
      ]
    );
  };

  const hasPhotos = profile?.photos?.front || profile?.photos?.side;

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
            {!hasPhotos && (
              <SlideUp>
                <EmptyState
                  icon="camera-outline"
                  title="No photos uploaded"
                  message="Upload full-body photos to get more accurate outfit previews mapped to your body type."
                  actionTitle="Upload Photos"
                  onAction={() => router.push('/setup')}
                />
              </SlideUp>
            )}

            {hasPhotos && (
              <SlideUp>
                <Text style={styles.sectionTitle}>Manage Photos</Text>
                <Text style={styles.sectionSubtitle}>
                  These are used to accurately visualize how outfits will look on you.
                </Text>
              </SlideUp>
            )}

            {hasPhotos && (
              <View style={styles.photosGrid}>
                {profile.photos.front && (
                  <SlideUp>
                    <Card style={styles.photoCard}>
                      <Image source={{ uri: profile.photos.front }} style={styles.image} />
                      <View style={styles.photoInfo}>
                        <Text style={styles.photoLabel}>Front View</Text>
                        <PressScale onPress={() => handleRemovePhoto('front')} style={styles.deleteButton} hitSlop={10}>
                          <Ionicons name="trash-outline" size={20} color={theme.danger} />
                        </PressScale>
                      </View>
                    </Card>
                  </SlideUp>
                )}

                {profile.photos.side && (
                  <SlideUp>
                    <Card style={styles.photoCard}>
                      <Image source={{ uri: profile.photos.side }} style={styles.image} />
                      <View style={styles.photoInfo}>
                        <Text style={styles.photoLabel}>Side View</Text>
                        <PressScale onPress={() => handleRemovePhoto('side')} style={styles.deleteButton} hitSlop={10}>
                          <Ionicons name="trash-outline" size={20} color={theme.danger} />
                        </PressScale>
                      </View>
                    </Card>
                  </SlideUp>
                )}
              </View>
            )}

            {hasPhotos && (!profile.photos.front || !profile.photos.side) && (
              <SlideUp>
                <Button 
                  title="Upload Missing Photos" 
                  variant="outline" 
                  onPress={() => router.push('/setup')} 
                  style={styles.uploadButton}
                  icon={<Ionicons name="camera-outline" size={18} color={theme.text} />}
                />
              </SlideUp>
            )}
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
  photosGrid: {
    gap: Layout.spacing.lg,
  },
  photoCard: {
    overflow: 'hidden',
    padding: 0,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: theme.surfaceElevated,
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
    backgroundColor: theme.surface,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.danger}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    marginTop: Layout.spacing.xl,
  },
});

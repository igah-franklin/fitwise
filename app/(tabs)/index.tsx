import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { useTheme } from '@/lib/theme';
import { THEME } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { getOutfits, hydrateOutfits, formatTimeAgo, occasionLabel } from '@/lib/outfits';
import { useWardrobe } from '@/lib/wardrobe';
import { EmptyState } from '@/components/layout/EmptyState';
import { useFeatureFlag } from 'posthog-react-native';

const { width } = Dimensions.get('window');
// Account for both the Screen's outer padding and the container's inner padding,
// minus the gap between the two cards, so exactly two fit per row.
const cardWidth =
  (width - Layout.padding.screen * 2 - Layout.spacing.lg * 2 - Layout.spacing.md) / 2;

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const wardrobe = useWardrobe();
  const [recentOutfits, setRecentOutfits] = React.useState<any[]>([]);
  const showPremiumStyles = useFeatureFlag('show-premium-outfit-styles');

  useFocusEffect(
    React.useCallback(() => {
      // Load outfits and update state to trigger re-render on the home screen
      hydrateOutfits().then(() => {
        setRecentOutfits(getOutfits().slice(0, 3));
      });
    }, [])
  );

  const ownedItems = wardrobe.filter((i) => i.status === 'owned' || i.status === 'purchased').length;

  const handleGenerateWardrobe = () => {
    // Walk the user through the steps (measurements, style, budget,
    // photos) so they can generate/refresh their wardrobe.
    router.push('/setup');
  };

  const handleSetupProfile = () => {
    router.push('/setup');
  };

  return (
    <Screen>
      <AnimatedScreen>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>Style Champion</Text>
            </View>
            <View style={styles.headerRight}>
              <PressScale style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color={theme.text} />
              </PressScale>
            </View>
          </View>

          {/* Hero Section */}
          <Stagger step={70} initialDelay={120}>
            <SlideUp>
              <LinearGradient
                colors={[theme.primary, '#1F4A7A']}
                style={styles.heroCard}
              >
                <View style={styles.heroContent}>
                  <View style={styles.heroText}>
                    <Text style={styles.heroTitle}>Ready to look</Text>
                    <Text style={styles.heroTitle}>your best?</Text>
                    <Text style={styles.heroSubtitle}>
                      Generate the perfect wardrobe based on your preferences
                    </Text>
                  </View>
                  <View style={styles.heroIcon}>
                    <Ionicons name="woman-outline" size={32} color={theme.onPrimary} />
                  </View>
                </View>
                <Button
                  title="Generate Wardrobe"
                  variant="secondary"
                  onPress={handleGenerateWardrobe}
                  style={styles.heroButton}
                />
              </LinearGradient>
            </SlideUp>

            {/* Quick Stats */}
            <SlideUp>
              <View style={styles.statsRow}>
                <Card style={[styles.statCard, { width: cardWidth }]} padding="md">
                  <View style={styles.statHeader}>
                    <Ionicons name="shirt-outline" size={20} color={theme.primary} />
                    <Text style={styles.statValue}>{wardrobe.length}</Text>
                  </View>
                  <Text style={styles.statLabel}>Wardrobe Items</Text>
                </Card>

                <Card style={[styles.statCard, { width: cardWidth }]} padding="md">
                  <View style={styles.statHeader}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
                    <Text style={styles.statValue}>{ownedItems}</Text>
                  </View>
                  <Text style={styles.statLabel}>Owned Items</Text>
                </Card>
              </View>
            </SlideUp>

            {/* Quick Actions */}
            <SlideUp>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <PressScale style={[styles.actionCard, { width: cardWidth }]} onPress={handleSetupProfile}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="person-outline" size={24} color={theme.primary} />
                  </View>
                  <Text style={styles.actionTitle}>Setup Profile</Text>
                  <Text style={styles.actionSubtitle}>Add measurements & preferences</Text>
                </PressScale>

                <PressScale style={[styles.actionCard, { width: cardWidth }]} onPress={() => router.push('/analytics')}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="trending-up-outline" size={24} color={theme.success} />
                  </View>
                  <Text style={styles.actionTitle}>Style Analytics</Text>
                  <Text style={styles.actionSubtitle}>Track your style journey</Text>
                </PressScale>
              </View>
            </SlideUp>

            {/* PostHog Feature Flag Demo Callout */}
            {!!showPremiumStyles && (
              <SlideUp>
                <Card style={styles.premiumBanner} padding="md">
                  <View style={styles.premiumHeader}>
                    <Ionicons name="sparkles" size={18} color="#FFD700" style={{ marginRight: 8 }} />
                    <Text style={styles.premiumTag}>Premium Feature Enabled</Text>
                  </View>
                  <Text style={styles.premiumText}>
                    This content is dynamically shown using PostHog feature flags. Try modifying the flag on your PostHog dashboard!
                  </Text>
                </Card>
              </SlideUp>
            )}

            {/* Recent Activity */}
            <SlideUp>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {recentOutfits.length > 0 ? (
                recentOutfits.map((outfit) => {
                  const pieces = outfit.items.slice(0, 2); // get up to two pieces for thumbnails
                  return (
                    <PressScale
                      key={outfit.id}
                      style={styles.recentActivityCard}
                      onPress={() => router.push(`/outfit/${outfit.id}`)}
                    >
                      <View style={styles.recentImagesWrapper}>
                        {pieces.map((p: any, idx: number) => {
                          if (!p.wardrobeItem?.imageUrl) return null;
                          return (
                            <Image
                              key={p.id || p._id || idx}
                              source={{ uri: p.wardrobeItem.imageUrl }}
                              style={[
                                styles.recentImage,
                                idx > 0 && styles.recentImageOverlap
                              ]}
                            />
                          );
                        })}
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{occasionLabel(outfit.occasion)} Outfit</Text>
                        <Text style={styles.activityTime}>{formatTimeAgo(outfit.createdAt)}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </PressScale>
                  );
                })
              ) : (
                <EmptyState
                  icon="shirt-outline"
                  title="No recent outfits"
                  message="Generate an outfit to see it here."
                />
              )}
            </SlideUp>
          </Stagger>
        </View>
      </AnimatedScreen>
    </Screen>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  greeting: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  heroCard: {
    padding: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.xl,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.onPrimary,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Layout.spacing.sm,
    lineHeight: 22,
  },
  heroIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButton: {
    backgroundColor: theme.onPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.xl,
  },
  statCard: {
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  statLabel: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: Layout.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  actionCard: {
    padding: Layout.spacing.lg,
    backgroundColor: theme.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    backgroundColor: theme.primaryMuted,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  premiumBanner: {
    backgroundColor: '#1E1E2C',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.xl,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  premiumTag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  premiumText: {
    fontSize: 13,
    color: '#D1D1D6',
    lineHeight: 18,
  },
  activityCard: {
    gap: Layout.spacing.md,
  },
  recentActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: theme.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: Layout.spacing.sm,
  },
  recentImagesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
    width: 60,
  },
  recentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 2,
    borderColor: theme.surface,
  },
  recentImageOverlap: {
    marginLeft: -20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    color: theme.textMuted,
  },
});
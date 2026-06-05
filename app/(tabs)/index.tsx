import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { THEME } from '@/lib/theme';
import { Layout } from '@/constants/Layout';

const { width } = Dimensions.get('window');
// Account for both the Screen's outer padding and the container's inner padding,
// minus the gap between the two cards, so exactly two fit per row.
const cardWidth =
  (width - Layout.padding.screen * 2 - Layout.spacing.lg * 2 - Layout.spacing.md) / 2;

export default function HomeScreen() {
  const handleGenerateOutfit = () => {
    // Always walk the user through the steps (measurements, style, budget,
    // photos) so they can generate/refresh their wardrobe and outfit.
    router.push('/setup?occasion=casual');
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
                <Ionicons name="notifications-outline" size={24} color={THEME.text} />
              </PressScale>
            </View>
          </View>

          {/* Hero Section */}
          <Stagger step={70} initialDelay={120}>
            <SlideUp>
              <LinearGradient
                colors={[THEME.primary, '#1F4A7A']}
                style={styles.heroCard}
              >
                <View style={styles.heroContent}>
                  <View style={styles.heroText}>
                    <Text style={styles.heroTitle}>Ready to look</Text>
                    <Text style={styles.heroTitle}>your best?</Text>
                    <Text style={styles.heroSubtitle}>
                      Generate the perfect outfit for any occasion with AI
                    </Text>
                  </View>
                  <View style={styles.heroIcon}>
                    <Ionicons name="sparkles" size={32} color={THEME.onPrimary} />
                  </View>
                </View>
                <Button
                  title="Generate Outfit"
                  variant="secondary"
                  onPress={handleGenerateOutfit}
                  style={styles.heroButton}
                />
              </LinearGradient>
            </SlideUp>

            {/* Quick Stats */}
            <SlideUp>
              <View style={styles.statsRow}>
                <Card style={[styles.statCard, { width: cardWidth }]} padding="md">
                  <View style={styles.statHeader}>
                    <Ionicons name="shirt-outline" size={20} color={THEME.primary} />
                    <Text style={styles.statValue}>12</Text>
                  </View>
                  <Text style={styles.statLabel}>Wardrobe Items</Text>
                </Card>
                
                <Card style={[styles.statCard, { width: cardWidth }]} padding="md">
                  <View style={styles.statHeader}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={THEME.success} />
                    <Text style={styles.statValue}>8</Text>
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
                    <Ionicons name="person-outline" size={24} color={THEME.primary} />
                  </View>
                  <Text style={styles.actionTitle}>Setup Profile</Text>
                  <Text style={styles.actionSubtitle}>Add measurements & preferences</Text>
                </PressScale>

                <PressScale style={[styles.actionCard, { width: cardWidth }]} onPress={() => router.push('/setup')}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="camera-outline" size={24} color={THEME.accent} />
                  </View>
                  <Text style={styles.actionTitle}>Upload Photos</Text>
                  <Text style={styles.actionSubtitle}>For better outfit previews</Text>
                </PressScale>

                <PressScale style={[styles.actionCard, { width: cardWidth }]} onPress={() => router.push('/(tabs)/wardrobe')}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="bag-outline" size={24} color={THEME.primary} />
                  </View>
                  <Text style={styles.actionTitle}>Build Wardrobe</Text>
                  <Text style={styles.actionSubtitle}>Get AI recommendations</Text>
                </PressScale>

                <PressScale style={[styles.actionCard, { width: cardWidth }]}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="trending-up-outline" size={24} color={THEME.success} />
                  </View>
                  <Text style={styles.actionTitle}>Style Analytics</Text>
                  <Text style={styles.actionSubtitle}>Track your style journey</Text>
                </PressScale>
              </View>
            </SlideUp>

            {/* Recent Activity */}
            <SlideUp>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Card padding="md" style={styles.activityCard}>
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="sparkles" size={18} color={THEME.primary} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Casual Friday Outfit</Text>
                    <Text style={styles.activityTime}>Generated 2 hours ago</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={THEME.textMuted} />
                </View>
                
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="checkmark-circle" size={18} color={THEME.success} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Navy Chinos</Text>
                    <Text style={styles.activityTime}>Marked as purchased</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={THEME.textMuted} />
                </View>
                
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="add-circle" size={18} color={THEME.accent} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>White Oxford Shirt</Text>
                    <Text style={styles.activityTime}>Added to wardrobe</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={THEME.textMuted} />
                </View>
              </Card>
            </SlideUp>
          </Stagger>
        </View>
      </AnimatedScreen>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
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
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
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
    color: THEME.onPrimary,
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
    backgroundColor: THEME.onPrimary,
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
    color: THEME.text,
  },
  statLabel: {
    fontSize: 13,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
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
    backgroundColor: THEME.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    backgroundColor: THEME.primaryMuted,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  activityCard: {
    gap: Layout.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    backgroundColor: THEME.primaryMuted,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: THEME.textMuted,
  },
});
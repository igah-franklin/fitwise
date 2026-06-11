import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { THEME } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { useProfile, styleLabel, budgetLabel } from '@/lib/profile';
import { useWardrobe } from '@/lib/wardrobe';
import { getOutfits } from '@/lib/outfits';
import type { ClothingCategory } from '@/lib/types';

const CATEGORIES: { key: ClothingCategory; label: string; color: string }[] = [
  { key: 'tops', label: 'Tops', color: '#4F8EF7' },
  { key: 'bottoms', label: 'Bottoms', color: '#5B3256' },
  { key: 'outerwear', label: 'Outerwear', color: '#FF7051' },
  { key: 'shoes', label: 'Shoes', color: '#50C878' },
  { key: 'accessories', label: 'Accessories', color: '#F4C430' },
];

export default function AnalyticsScreen() {
  const profile = useProfile();
  const wardrobe = useWardrobe();
  const outfits = getOutfits();

  const totalItems = wardrobe.length;
  const ownedItems = wardrobe.filter((w) => w.status === 'owned' || w.status === 'purchased').length;
  const shopabilityScore = totalItems > 0 ? Math.round((ownedItems / totalItems) * 100) : 0;

  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: wardrobe.filter((w) => w.category === cat.key).length,
  }));

  const maxCount = Math.max(...categoryCounts.map((c) => c.count), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressScale style={styles.headerButton} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={THEME.text} />
        </PressScale>
        <Text style={styles.headerTitle}>Style Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AnimatedScreen>
          <Stagger step={70} initialDelay={100}>
            {/* Overview */}
            <SlideUp>
              <Card style={styles.overviewCard} padding="lg">
                <View style={styles.overviewHeader}>
                  <Ionicons name="stats-chart" size={24} color={THEME.primary} />
                  <Text style={styles.overviewTitle}>Shop-ability Score</Text>
                </View>
                <Text style={styles.overviewValue}>{shopabilityScore}%</Text>
                <Text style={styles.overviewSubtitle}>
                  You own {ownedItems} out of {totalItems} recommended items.
                </Text>
                {/* Progress bar */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${shopabilityScore}%` }]} />
                </View>
              </Card>
            </SlideUp>

            {/* Wardrobe Composition */}
            <SlideUp>
              <Text style={styles.sectionTitle}>Wardrobe Composition</Text>
              <Card padding="lg" style={styles.compositionCard}>
                {categoryCounts.map((cat) => (
                  <View key={cat.key} style={styles.barRow}>
                    <Text style={styles.barLabel}>{cat.label}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { backgroundColor: cat.color, width: `${(cat.count / maxCount) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.barValue}>{cat.count}</Text>
                  </View>
                ))}
              </Card>
            </SlideUp>

            {/* Usage Stats */}
            <SlideUp>
              <Text style={styles.sectionTitle}>App Usage</Text>
              <View style={styles.statsGrid}>
                <Card style={styles.statCard} padding="md">
                  <Ionicons name="sparkles" size={24} color={THEME.accent} style={styles.statIcon} />
                  <Text style={styles.statNumber}>{outfits.length}</Text>
                  <Text style={styles.statLabel}>Outfits Generated</Text>
                </Card>
                <Card style={styles.statCard} padding="md">
                  <Ionicons name="pricetags" size={24} color={THEME.success} style={styles.statIcon} />
                  <Text style={styles.statNumber} numberOfLines={1}>
                    {profile ? budgetLabel(profile.budget) : 'N/A'}
                  </Text>
                  <Text style={styles.statLabel}>Target Budget</Text>
                </Card>
              </View>
            </SlideUp>
          </Stagger>
        </AnimatedScreen>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
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
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  overviewCard: {
    marginBottom: Layout.spacing.xl,
    backgroundColor: THEME.surfaceElevated,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  overviewValue: {
    fontSize: 48,
    fontWeight: '800',
    color: THEME.primary,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: Layout.spacing.lg,
    marginTop: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: THEME.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: Layout.spacing.md,
  },
  compositionCard: {
    marginBottom: Layout.spacing.xl,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  barLabel: {
    width: 80,
    fontSize: 13,
    fontWeight: '500',
    color: THEME.text,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: THEME.surfaceElevated,
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: Layout.spacing.md,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barValue: {
    width: 24,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: Layout.spacing.sm,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
});

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { EmptyState } from '@/components/layout/EmptyState';
import { THEME } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { isProfileComplete, getProfile } from '@/lib/profile';
import { useWardrobe, buildWardrobe } from '@/lib/wardrobe';
import type { WardrobeItem, ClothingCategory } from '@/lib/types';

const { width } = Dimensions.get('window');
const cardWidth = (width - Layout.spacing.lg * 3) / 2;

const categories: { key: ClothingCategory; label: string; icon: string }[] = [
  { key: 'tops', label: 'Tops', icon: 'shirt-outline' },
  { key: 'bottoms', label: 'Bottoms', icon: 'trail-sign-outline' },
  { key: 'outerwear', label: 'Outerwear', icon: 'jacket-outline' },
  { key: 'shoes', label: 'Shoes', icon: 'footsteps-outline' },
  { key: 'accessories', label: 'Accessories', icon: 'watch-outline' },
];

export default function WardrobeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');
  const [rebuilding, setRebuilding] = useState(false);
  const wardrobeItems = useWardrobe();

  const filteredItems = selectedCategory === 'all'
    ? wardrobeItems
    : wardrobeItems?.filter(item => item.category === selectedCategory);

  const handleGenerateWardrobe = async () => {
    const profile = getProfile();
    if (!isProfileComplete() || !profile) {
      router.push('/setup');
      return;
    }
    setRebuilding(true);
    try {
      await buildWardrobe({
        primaryStyle: profile.primaryStyle,
        secondaryStyles: profile.secondaryStyles,
        budget: profile.budget,
      });
    } finally {
      setRebuilding(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'owned': return 'checkmark-circle';
      case 'purchased': return 'bag-check';
      case 'recommended': return 'add-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'owned': return THEME.success;
      case 'purchased': return THEME.primary;
      case 'recommended': return THEME.textMuted;
      default: return THEME.textMuted;
    }
  };

  const renderWardrobeItem = ({ item }: { item: WardrobeItem }) => (
    <PressScale style={[styles.itemCard, { width: cardWidth }]}>
      <View style={styles.itemHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: THEME.primaryMuted }]}>
          <Text style={[styles.categoryBadgeText, { color: THEME.primary }]}>
            {item.category.toUpperCase()}
          </Text>
        </View>
        <Ionicons 
          name={getStatusIcon(item.status) as any} 
          size={18} 
          color={getStatusColor(item.status)} 
        />
      </View>
      
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDetails}>{item.color} • {item.fit}</Text>
      <Text style={styles.itemBudget}>{item.budgetRange}</Text>
      
      <View style={styles.itemFooter}>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
        <Text style={styles.itemStatus}>{item.status.charAt(0).toUpperCase() + item.status?.slice(1)}</Text>
      </View>
    </PressScale>
  );

  const renderCategoryFilter = ({ item }: { item: typeof categories[0] }) => (
    <PressScale 
      style={[
        styles.filterChip,
        selectedCategory === item.key && { backgroundColor: THEME.primary }
      ]}
      onPress={() => setSelectedCategory(item.key)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={16} 
        color={selectedCategory === item.key ? THEME.onPrimary : THEME.textMuted} 
      />
      <Text style={[
        styles.filterChipText,
        { color: selectedCategory === item.key ? THEME.onPrimary : THEME.textMuted }
      ]}>
        {item.label}
      </Text>
    </PressScale>
  );

  return (
    <Screen scroll={false}>
      <AnimatedScreen>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>My Wardrobe</Text>
            <PressScale style={styles.addButton}>
              <Ionicons name="add" size={24} color={THEME.primary} />
            </PressScale>
          </View>

          {wardrobeItems.length === 0 ? (
            <EmptyState
              icon="sparkles-outline"
              title="Build your wardrobe"
              message="Tell us your measurements, style and budget and we'll create a personalized wardrobe you can shop from."
              actionTitle="Get Started"
              onAction={() => router.push('/setup')}
            />
          ) : (
          <Stagger step={60} initialDelay={100}>
            <SlideUp>
              <View style={styles.filtersContainer}>
                <PressScale 
                  style={[
                    styles.filterChip,
                    selectedCategory === 'all' && { backgroundColor: THEME.primary }
                  ]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Ionicons 
                    name="apps-outline" 
                    size={16} 
                    color={selectedCategory === 'all' ? THEME.onPrimary : THEME.textMuted} 
                  />
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedCategory === 'all' ? THEME.onPrimary : THEME.textMuted }
                  ]}>
                    All
                  </Text>
                </PressScale>
                
                <FlatList
                  data={categories}
                  renderItem={renderCategoryFilter}
                  keyExtractor={(item) => item.key}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersList}
                />
              </View>
            </SlideUp>

            {/* Stats */}
            <SlideUp>
              <View style={styles.statsRow}>
                <Card style={styles.statCard} padding="md">
                  <Text style={styles.statNumber}>{wardrobeItems.length}</Text>
                  <Text style={styles.statLabel}>Total Items</Text>
                </Card>
                <Card style={styles.statCard} padding="md">
                  <Text style={styles.statNumber}>
                    {wardrobeItems?.filter(item => item.status === 'owned').length}
                  </Text>
                  <Text style={styles.statLabel}>Owned</Text>
                </Card>
                <Card style={styles.statCard} padding="md">
                  <Text style={styles.statNumber}>
                    {wardrobeItems?.filter(item => item.status === 'recommended').length}
                  </Text>
                  <Text style={styles.statLabel}>To Buy</Text>
                </Card>
              </View>
            </SlideUp>

            {/* Wardrobe Items */}
            <SlideUp>
              {filteredItems.length > 0 ? (
                <FlatList
                  data={filteredItems}
                  renderItem={renderWardrobeItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.row}
                  contentContainerStyle={styles.itemsList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <EmptyState
                  icon="shirt-outline"
                  title="No items found"
                  message="No wardrobe items match your current filter"
                  actionTitle="View All Items"
                  onAction={() => setSelectedCategory('all')}
                />
              )}
            </SlideUp>

            {/* Regenerate Wardrobe Button */}
            <SlideUp>
              <Button
                title={rebuilding ? 'Regenerating…' : 'Regenerate Wardrobe'}
                variant="primary"
                loading={rebuilding}
                onPress={handleGenerateWardrobe}
                icon={<Ionicons name="sparkles" size={18} color={THEME.onPrimary} />}
                style={styles.generateButton}
              />
            </SlideUp>
          </Stagger>
          )}
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: THEME.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  filtersList: {
    gap: Layout.spacing.sm,
  },
  filterChip: {
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
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  itemsList: {
    paddingBottom: Layout.spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  itemCard: {
    backgroundColor: THEME.surface,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  itemBudget: {
    fontSize: 12,
    color: THEME.textMuted,
    fontWeight: '500',
    marginBottom: Layout.spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  itemStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.primary,
  },
  generateButton: {
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.xxl,
  },
});
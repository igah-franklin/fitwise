import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Image as RNImage, Alert } from 'react-native';
import Animated, { FadeIn, FadeOut, withRepeat, withTiming, useSharedValue, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { EmptyState } from '@/components/layout/EmptyState';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { useWardrobe, markAsOwned, swapItem, removeWardrobeItem } from '@/lib/wardrobe';
import type { WardrobeItem, ClothingCategory } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { ConfirmSwapModal } from '@/components/ui/ConfirmSwapModal';
import { GeneratingWardrobeScreen } from '@/components/GeneratingScreen';
import { UsageIndicator } from '@/components/UsageIndicator';
import { useSubscription } from '@/lib/subscription';

const { width } = Dimensions.get('window');
const cardWidth = (width - Layout.spacing.lg * 3) / 2;

const categories: { key: ClothingCategory; label: string; icon: string }[] = [
  { key: 'tops', label: 'Tops', icon: 'shirt-outline' },
  { key: 'bottoms', label: 'Bottoms', icon: 'trail-sign-outline' },
  { key: 'outerwear', label: 'Outerwear', icon: 'layers-outline' },
  { key: 'shoes', label: 'Shoes', icon: 'footsteps-outline' },
  { key: 'accessories', label: 'Accessories', icon: 'watch-outline' },
];

function SkeletonImage({ uri, style, theme }: { uri: string, style: any, theme: any }) {
  const [loaded, setLoaded] = useState(false);
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    if (!loaded) {
      opacity.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [loaded]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={style}>
      {!loaded && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { backgroundColor: theme.border, borderRadius: style.borderRadius }]} />
      )}
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
        onLoadEnd={() => setLoaded(true)}
      />
    </View>
  );
}

export default function WardrobeScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { subscriptionTier } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');
  const [rebuilding, setRebuilding] = useState(false);
  const wardrobeItems = useWardrobe();
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [swapItemId, setSwapItemId] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const itemToDelete = wardrobeItems?.find(item => ((item as any)._id || item.id) === deleteItemId);
  const itemToSwap = wardrobeItems?.find(item => ((item as any)._id || item.id) === swapItemId);

  const confirmRemoveItem = () => {
    if (deleteItemId) {
      removeWardrobeItem(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? wardrobeItems
    : wardrobeItems?.filter(item => item.category === selectedCategory);

  const handleGenerateWardrobe = () => {
    router.push('/setup');
  };

  const handleSwapItem = async (id: string) => {
    setIsSwapping(true);
    try {
      await swapItem(id);
      setSwapItemId(null);
    } catch (error: any) {
      const errMsg = (error.message || '').toLowerCase();
      if (errMsg.includes('limit') || errMsg.includes('exceeded') || errMsg.includes('403')) {
        Alert.alert(
          'Limit Reached',
          'You have reached your limit of wardrobe item generations for this month. Upgrade to Pro or Premium to generate more items!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => {
              setSwapItemId(null);
              router.push('/paywall');
            }}
          ]
        );
      } else if (errMsg.match(/quota|429|503|demand|unavailable|busy|temporary/)) {
        Alert.alert(
          'High Traffic',
          "We're experiencing high traffic with our provider. Please try again in a few moments."
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to swap item.');
      }
    } finally {
      setIsSwapping(false);
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
      case 'owned': return theme.success;
      case 'purchased': return theme.primary;
      case 'recommended': return theme.textMuted;
      default: return theme.textMuted;
    }
  };

  const renderWardrobeItem = ({ item }: { item: WardrobeItem }) => (
    <PressScale style={[styles.itemCard, { width: cardWidth }]}>
      <View style={styles.itemHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: theme.primaryMuted }]}>
          <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
            PHASE {item.priorityPhase ?? 1}
          </Text>
        </View>
        <View style={styles.itemHeaderRight}>
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={18}
            color={getStatusColor(item.status)}
          />
          <PressScale
            onPress={() => {
              if (subscriptionTier === 'free') {
                router.push('/paywall');
              } else {
                setDeleteItemId((item as any)._id || item.id);
              }
            }}
            hitSlop={10}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
          </PressScale>
        </View>
      </View>

      {item.imageUrl ? (
        <SkeletonImage uri={item.imageUrl} style={styles.imageContainer} theme={theme} />
      ) : (
        <View style={[styles.imageContainer, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={theme.border} />
        </View>
      )}

      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.itemDetails} numberOfLines={1}>{item.color} • Size {item.recommendedSize}</Text>
      <Text style={styles.itemBudget}>{item.budgetRange}</Text>

      <View style={styles.itemActions}>
        {item.status !== 'owned' && (
          <PressScale onPress={() => markAsOwned((item as any)._id || item.id)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Own it</Text>
          </PressScale>
        )}
        <PressScale onPress={() => setSwapItemId((item as any)._id || item.id)} style={styles.actionButtonSecondary}>
          <Text style={styles.actionButtonTextSecondary}>Swap</Text>
        </PressScale>
      </View>
    </PressScale>
  );

  const renderCategoryFilter = ({ item }: { item: typeof categories[0] }) => (
    <PressScale
      style={[
        styles.filterChip,
        selectedCategory === item.key && { backgroundColor: theme.primary }
      ]}
      onPress={() => setSelectedCategory(item.key)}
    >
      <Ionicons
        name={item.icon as any}
        size={16}
        color={selectedCategory === item.key ? theme.onPrimary : theme.textMuted}
      />
      <Text style={[
        styles.filterChipText,
        { color: selectedCategory === item.key ? theme.onPrimary : theme.textMuted }
      ]}>
        {item.label}
      </Text>
    </PressScale>
  );

  if (rebuilding) {
    return <GeneratingWardrobeScreen />;
  }

  return (
    <Screen scroll={false}>
      <AnimatedScreen style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>My Wardrobe</Text>
            <PressScale style={styles.addButton} onPress={() => router.push('/setup')}>
              <Ionicons name="add" size={24} color={theme.primary} />
            </PressScale>
          </View>

          {wardrobeItems.length === 0 ? (
            <EmptyState
              icon="shirt-outline"
              title="Build your wardrobe"
              message="Tell us your measurements, style and budget and we'll create a personalized wardrobe you can shop from."
              actionTitle="Get Started"
              onAction={() => router.push('/setup')}
            />
          ) : (
            <Stagger step={60} initialDelay={100}>
              <SlideUp>
                <UsageIndicator type="wardrobe" />
              </SlideUp>

              <SlideUp>
                <View style={styles.filtersContainer}>
                  <PressScale
                    style={[
                      styles.filterChip,
                      selectedCategory === 'all' && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setSelectedCategory('all')}
                  >
                    <Ionicons
                      name="apps-outline"
                      size={16}
                      color={selectedCategory === 'all' ? theme.onPrimary : theme.textMuted}
                    />
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedCategory === 'all' ? theme.onPrimary : theme.textMuted }
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
              <SlideUp style={{ flex: 1 }}>
                {filteredItems.length > 0 ? (
                  <FlatList
                    data={filteredItems}
                    renderItem={renderWardrobeItem}
                    keyExtractor={(item, index) => (item as any)._id || item.id || index.toString()}
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
              {/* <SlideUp>
                <Button
                  title={rebuilding ? 'Regenerating…' : 'Regenerate Wardrobe'}
                  variant="primary"
                  loading={rebuilding}
                  onPress={handleGenerateWardrobe}
                  icon={<Ionicons name="sparkles" size={18} color={theme.onPrimary} />}
                  style={styles.generateButton}
                />
              </SlideUp> */}
            </Stagger>
          )}
        </View>
      </AnimatedScreen>

      <ConfirmDeleteModal
        visible={!!deleteItemId}
        title="Delete Item"
        message="Are you sure you want to delete this wardrobe item? This action cannot be undone."
        itemName={itemToDelete?.name}
        onConfirm={confirmRemoveItem}
        onCancel={() => setDeleteItemId(null)}
      />

      <ConfirmSwapModal
        visible={!!swapItemId}
        title="Swap Wardrobe Item?"
        message="Are you sure you want to regenerate and replace this item? This will generate a new suggestion tailored to your style preferences."
        itemName={itemToSwap?.name}
        onConfirm={() => {
          if (swapItemId) {
            handleSwapItem(swapItemId);
          }
        }}
        onCancel={() => setSwapItemId(null)}
        isSwapping={isSwapping}
      />
    </Screen>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
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
    color: theme.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
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
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
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
    backgroundColor: theme.surface,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
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
  itemHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Layout.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: Layout.spacing.sm,
    backgroundColor: theme.surfaceElevated,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  itemBudget: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    marginBottom: Layout.spacing.sm,
  },
  itemActions: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.onPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: theme.surfaceElevated,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionButtonTextSecondary: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '600',
  },
  generateButton: {
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.xxl,
  },
});
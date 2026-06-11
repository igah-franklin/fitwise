import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import {
  getOutfitById,
  generateOutfit,
  estimateOutfitBudget,
  formatTimeAgo,
  occasionLabel,
  updateOutfitFeedback,
  removeOutfit,
} from '@/lib/outfits';
import type { ClothingCategory, ItemStatus, OutfitItem } from '@/lib/types';
import { GeneratingOutfitScreen } from '@/components/GeneratingOutfitScreen';

const CATEGORY_ICON: Record<ClothingCategory, string> = {
  tops: 'shirt-outline',
  bottoms: 'trail-sign-outline',
  outerwear: 'layers-outline',
  shoes: 'footsteps-outline',
  accessories: 'watch-outline',
};

const getStatusMeta = (theme: any): Record<ItemStatus, { label: string; color: string; icon: string }> => ({
  owned: { label: 'In wardrobe', color: theme.success, icon: 'checkmark-circle' },
  purchased: { label: 'Purchased', color: theme.primary, icon: 'bag-check' },
  recommended: { label: 'Suggested', color: theme.warning, icon: 'add-circle-outline' },
  replaced: { label: 'Replaced', color: theme.textMuted, icon: 'swap-horizontal-outline' },
});

export default function OutfitDetailsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [outfit, setOutfit] = useState(() => (id ? getOutfitById(id) : undefined));
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | undefined>(outfit?.feedback);

  if (!outfit) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Ionicons name="shirt-outline" size={48} color={theme.textMuted} />
          <Text style={styles.notFoundTitle}>Outfit not found</Text>
          <Text style={styles.notFoundText}>
            This outfit may have expired. Generate a fresh look to get started.
          </Text>
          <Button title="Back to Outfits" onPress={() => router.back()} style={styles.notFoundButton} />
        </View>
      </SafeAreaView>
    );
  }

  const budget = estimateOutfitBudget(outfit);
  const ownedCount = outfit.items.filter(
    (i) => i.wardrobeItem.status === 'owned' || i.wardrobeItem.status === 'purchased',
  ).length;
  const toBuyCount = outfit.items.length - ownedCount;

  const handleSave = () => {
    setSaved((prev) => !prev);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const next = await generateOutfit(outfit.occasion);
      setRegenerating(false);
      setSaved(false);
      setFeedback(undefined);
      setOutfit(next);
      router.setParams({ id: next.id });
    } catch (e: any) {
      setRegenerating(false);
      Alert.alert('Generation Error', e.message);
    }
  };

  const handleFeedback = (type: 'like' | 'dislike') => {
    updateOutfitFeedback(outfit.id, type);
    setFeedback(type);
  };

  const handleShop = () => {
    if (toBuyCount === 0) {
      Alert.alert('All set', 'You already own every piece in this outfit.');
      return;
    }
    Alert.alert(
      'Shop the look',
      `We found ${toBuyCount} ${toBuyCount === 1 ? 'piece' : 'pieces'} to complete this outfit. Opening shopping recommendations.`,
    );
  };

  const renderItem = (item: OutfitItem) => {
    const w = item.wardrobeItem;
    const status = getStatusMeta(theme)[w.status] ?? getStatusMeta(theme).recommended;
    const icon = CATEGORY_ICON[w.category] ?? 'pricetag-outline';

    return (
      <PressScale key={item.id} style={styles.itemRow}>
        <View style={styles.itemIcon}>
          <Ionicons name={icon as any} size={22} color={theme.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{w.name}</Text>
          <Text style={styles.itemMeta}>
            {w.color} · {w.fit}
          </Text>
          <View style={styles.itemTags}>
            <View style={[styles.statusPill, { backgroundColor: `${status.color}1A` }]}>
              <Ionicons name={status.icon as any} size={12} color={status.color} />
              <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.itemShop}>{w.shoppingRecommendation}</Text>
          </View>
        </View>
        <View style={styles.itemBudgetWrap}>
          <Text style={styles.itemBudget}>{w.budgetRange}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </View>
      </PressScale>
    );
  };

  if (regenerating) {
    return <GeneratingOutfitScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressScale style={styles.headerButton} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </PressScale>
        <Text style={styles.headerTitle}>Outfit Details</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PressScale style={styles.headerButton} onPress={handleSave} hitSlop={10}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={22}
              color={saved ? theme.danger : theme.text}
            />
          </PressScale>
          <PressScale 
            style={styles.headerButton} 
            onPress={() => {
              removeOutfit(outfit.id);
              router.back();
            }} 
            hitSlop={10}
          >
            <Ionicons name="trash-outline" size={22} color={theme.danger} />
          </PressScale>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AnimatedScreen>
          <Stagger step={70} initialDelay={100}>
            {/* Hero preview */}
            <SlideUp>
              <View style={styles.hero}>
                <Image source={{ uri: outfit.previewUrl }} style={styles.heroImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={styles.heroOverlay}
                >
                  <View style={styles.occasionBadge}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                    <Text style={styles.occasionBadgeText}>
                      {occasionLabel(outfit.occasion).toUpperCase()}
                    </Text>
                  </View>
                  {outfit.weatherContext && (
                    <View style={styles.weatherBadge}>
                      <Ionicons name={outfit.weatherContext.condition === 'Sunny' ? 'sunny' : 'partly-sunny'} size={12} color="#fff" />
                      <Text style={styles.weatherBadgeText}>
                        {outfit.weatherContext.temp}°C {outfit.weatherContext.condition}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.heroTitle}>{outfit.name}</Text>
                  <Text style={styles.heroMeta}>
                    {outfit.items.length} pieces · Generated {formatTimeAgo(outfit.createdAt)}
                  </Text>
                </LinearGradient>
              </View>
            </SlideUp>

            {/* Summary */}
            <SlideUp>
              <View style={styles.summaryRow}>
                <Card padding="md" style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{outfit.items.length}</Text>
                  <Text style={styles.summaryLabel}>Pieces</Text>
                </Card>
                <Card padding="md" style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{ownedCount}</Text>
                  <Text style={styles.summaryLabel}>In wardrobe</Text>
                </Card>
                <Card padding="md" style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{toBuyCount}</Text>
                  <Text style={styles.summaryLabel}>To buy</Text>
                </Card>
              </View>
            </SlideUp>

            {/* Budget */}
            <SlideUp>
              <Card padding="lg" style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetIcon}>
                    <Ionicons name="pricetags-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.budgetText}>
                    <Text style={styles.budgetLabel}>Estimated total</Text>
                    <Text style={styles.budgetValue}>
                      ${budget.min} – ${budget.max}
                    </Text>
                  </View>
                </View>
                <Text style={styles.budgetNote}>
                  Based on the recommended price range for each piece.
                </Text>
              </Card>
            </SlideUp>

            {/* The look */}
            <SlideUp>
              <Text style={styles.sectionTitle}>The Look</Text>
              <View style={styles.itemsList}>{outfit.items.map(renderItem)}</View>
            </SlideUp>

            {/* Actions */}
            <SlideUp>
              <View style={styles.feedbackRow}>
                <PressScale 
                  style={[styles.feedbackButton, feedback === 'dislike' && styles.feedbackButtonActive]} 
                  onPress={() => handleFeedback('dislike')}
                >
                  <Ionicons name={feedback === 'dislike' ? 'thumbs-down' : 'thumbs-down-outline'} size={24} color={feedback === 'dislike' ? theme.danger : theme.textMuted} />
                </PressScale>
                <PressScale 
                  style={[styles.feedbackButton, feedback === 'like' && styles.feedbackButtonActive]} 
                  onPress={() => handleFeedback('like')}
                >
                  <Ionicons name={feedback === 'like' ? 'thumbs-up' : 'thumbs-up-outline'} size={24} color={feedback === 'like' ? theme.primary : theme.textMuted} />
                </PressScale>
              </View>

              <View style={styles.actions}>
                <Button
                  title={regenerating ? 'Regenerating…' : 'Give me another option'}
                  variant="primary"
                  loading={regenerating}
                  onPress={handleRegenerate}
                  icon={<Ionicons name="refresh-outline" size={18} color={theme.onPrimary} />}
                  style={styles.regenerateButton}
                />
                <Button
                  title={saved ? 'Saved to Collection' : 'Save Outfit'}
                  variant={saved ? 'secondary' : 'outline'}
                  onPress={handleSave}
                  icon={
                    <Ionicons
                      name={saved ? 'checkmark' : 'bookmark-outline'}
                      size={18}
                      color={saved ? theme.text : theme.textMuted}
                    />
                  }
                />
                {toBuyCount > 0 && (
                  <Button
                    title={`Shop ${toBuyCount} Missing ${toBuyCount === 1 ? 'Piece' : 'Pieces'}`}
                    variant="ghost"
                    onPress={handleShop}
                    icon={<Ionicons name="bag-outline" size={18} color={theme.primary} />}
                    style={styles.actionSpacing}
                  />
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
  hero: {
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    aspectRatio: 3 / 4,
    marginBottom: Layout.spacing.lg,
    backgroundColor: theme.surfaceElevated,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Layout.spacing.lg,
  },
  occasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.full,
    marginBottom: Layout.spacing.sm,
  },
  occasionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.6,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.full,
    marginBottom: Layout.spacing.sm,
  },
  weatherBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  heroMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  budgetCard: {
    marginBottom: Layout.spacing.xl,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  budgetIcon: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetText: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    marginTop: 2,
  },
  budgetNote: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: Layout.spacing.md,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: Layout.spacing.md,
  },
  itemsList: {
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    backgroundColor: theme.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: Layout.spacing.md,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  itemMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 1,
  },
  itemTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: Layout.borderRadius.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemShop: {
    fontSize: 11,
    color: theme.textMuted,
    flexShrink: 1,
  },
  itemBudgetWrap: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  itemBudget: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  actions: {
    gap: 0,
  },
  actionSpacing: {
    marginTop: Layout.spacing.md,
  },
  regenerateButton: {
    marginBottom: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Layout.spacing.xl,
    marginBottom: Layout.spacing.lg,
  },
  feedbackButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackButtonActive: {
    backgroundColor: theme.surface,
    borderColor: theme.primary,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
    gap: Layout.spacing.md,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  notFoundText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  notFoundButton: {
    marginTop: Layout.spacing.sm,
    alignSelf: 'stretch',
  },
});

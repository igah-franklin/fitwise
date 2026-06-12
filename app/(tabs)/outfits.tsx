import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedScreen, SlideUp, Stagger, PressScale } from '@/components/ui/Motion';
import { EmptyState } from '@/components/layout/EmptyState';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { getOutfits, formatTimeAgo, generateOutfit, removeOutfit } from '@/lib/outfits';
import type { Outfit, OutfitOccasion } from '@/lib/types';
import { GeneratingOutfitScreen } from '@/components/GeneratingOutfitScreen';

const { width } = Dimensions.get('window');
// Account for both the Screen's outer padding and the container's inner padding,
// minus the gap between the two cards, so exactly two fit per row.
const cardWidth =
  (width - Layout.padding.screen * 2 - Layout.spacing.lg * 2 - Layout.spacing.md) / 2;

const occasions: { key: OutfitOccasion; label: string; icon: string }[] = [
  { key: 'casual', label: 'Casual', icon: 'cafe-outline' },
  { key: 'work', label: 'Work', icon: 'briefcase-outline' },
  { key: 'date-night', label: 'Date Night', icon: 'heart-outline' },
  { key: 'night-out', label: 'Night Out', icon: 'wine-outline' },
  { key: 'travel', label: 'Travel', icon: 'airplane-outline' },
  { key: 'business-meeting', label: 'Meeting', icon: 'people-outline' },
];

export default function OutfitsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [selectedOccasion, setSelectedOccasion] = useState<OutfitOccasion>('casual');
  const [selectedVibe, setSelectedVibe] = useState('Standard');
  const [modalVisible, setModalVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>(() => getOutfits());

  // Refresh the list whenever the screen regains focus (e.g. after coming back
  // from the details screen, which may have generated/regenerated outfits).
  useFocusEffect(
    useCallback(() => {
      setOutfits(getOutfits());
    }, []),
  );

  const handleConfirmGenerate = async () => {
    setModalVisible(false);
    setIsGenerating(true);
    try {
      const newOutfit = await generateOutfit(selectedOccasion);
      setOutfits(getOutfits());
      setIsGenerating(false);
      router.push(`/outfit/${newOutfit.id}`);
    } catch (e: any) {
      setIsGenerating(false);
      alert(`Generation Error: ${e.message}`);
    }
  };

  const handleRemoveOutfit = (id: string) => {
    removeOutfit(id);
    setOutfits(getOutfits());
  };

  const renderOutfit = (outfit: Outfit) => (
    <PressScale
      key={outfit.id}
      style={styles.outfitCard}
      onPress={() => router.push(`/outfit/${outfit.id}`)}
    >
      <View style={styles.outfitPreview}>
        <Image source={{ uri: outfit.previewUrl }} style={styles.previewImage} />
        <View style={styles.outfitOverlay}>
          <View style={styles.occasionBadge}>
            <Text style={styles.occasionBadgeText}>{outfit.occasion.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.outfitInfo}>
        <View style={styles.outfitInfoHeader}>
          <Text style={styles.outfitName}>{outfit.name}</Text>
          <PressScale onPress={() => handleRemoveOutfit(outfit.id)} hitSlop={10}>
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
          </PressScale>
        </View>
        <Text style={styles.outfitTime}>{formatTimeAgo(outfit.createdAt)}</Text>
      </View>
    </PressScale>
  );

  if (isGenerating) {
    return <GeneratingOutfitScreen />;
  }

  return (
    <Screen>
      <AnimatedScreen>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Outfit Generator</Text>
            <PressScale style={styles.historyButton}>
              <Ionicons name="time-outline" size={24} color={theme.primary} />
            </PressScale>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Stagger step={70} initialDelay={120}>
              {/* Generator Card */}
              <SlideUp>
                <Card padding="lg" style={styles.generatorCard}>
                  <View style={styles.generatorHeader}>
                    <Ionicons name="sparkles" size={28} color={theme.primary} />
                    <View style={styles.generatorText}>
                      <Text style={styles.generatorTitle}>AI Outfit Generator</Text>
                      <Text style={styles.generatorSubtitle}>
                        Choose an occasion and get instant outfit recommendations
                      </Text>
                    </View>
                  </View>
                </Card>
              </SlideUp>

              {/* Generate Button */}
              <SlideUp>
                <Button
                  title="Create New Outfit"
                  variant="primary"
                  onPress={() => setModalVisible(true)}
                  icon={<Ionicons name="color-wand-outline" size={18} color={theme.onPrimary} />}
                  style={styles.generateButton}
                />
              </SlideUp>

              {/* Recent Outfits */}
              <SlideUp>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionTitle}>Recent Outfits</Text>
                </View>

                {outfits.length > 0 ? (
                  <View style={styles.outfitsGrid}>
                    {outfits?.map(renderOutfit)}
                  </View>
                ) : (
                  <EmptyState
                    icon="shirt-outline"
                    title="No outfits yet"
                    message="Generate your first AI-powered outfit to get started"
                    actionTitle="Create Outfit"
                    onAction={() => setModalVisible(true)}
                  />
                )}
              </SlideUp>

              {/* Features */}
              <SlideUp>
                <Text style={styles.sectionTitle}>Features</Text>
                <View style={styles.featuresGrid}>
                  <Card padding="md" style={styles.featureCard}>
                    <Ionicons name="person-outline" size={24} color={theme.accent} />
                    <Text style={styles.featureTitle}>Personal Fit</Text>
                    <Text style={styles.featureDescription}>
                      Outfits tailored to your body measurements
                    </Text>
                  </Card>

                  <Card padding="md" style={styles.featureCard}>
                    <Ionicons name="camera-outline" size={24} color={theme.primary} />
                    <Text style={styles.featureTitle}>Visual Preview</Text>
                    <Text style={styles.featureDescription}>
                      See how outfits look with your likeness
                    </Text>
                  </Card>

                  <Card padding="md" style={styles.featureCard}>
                    <Ionicons name="refresh-outline" size={24} color={theme.success} />
                    <Text style={styles.featureTitle}>Unlimited Tries</Text>
                    <Text style={styles.featureDescription}>
                      Generate as many variations as you want
                    </Text>
                  </Card>

                  <Card padding="md" style={styles.featureCard}>
                    <Ionicons name="bag-outline" size={24} color={theme.warning} />
                    <Text style={styles.featureTitle}>Smart Shopping</Text>
                    <Text style={styles.featureDescription}>
                      Direct links to buy recommended pieces
                    </Text>
                  </Card>
                </View>
              </SlideUp>
            </Stagger>
          </ScrollView>
        </View>
      </AnimatedScreen>

      {/* Generation Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Drag Handle Indicator */}
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Design Your Look</Text>
              <PressScale onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.text} />
              </PressScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalSectionTitle}>What's the occasion?</Text>
              <View style={styles.modalGrid}>
                {occasions.map((occ) => (
                  <PressScale
                    key={occ.key}
                    style={[
                      styles.modalChip,
                      selectedOccasion === occ.key && styles.modalChipActive
                    ]}
                    onPress={() => setSelectedOccasion(occ.key)}
                  >
                    <View style={[
                      styles.modalChipIconContainer,
                      selectedOccasion === occ.key && styles.modalChipIconContainerActive
                    ]}>
                      <Ionicons
                        name={occ.icon as any}
                        size={20}
                        color={selectedOccasion === occ.key ? theme.primary : theme.textMuted}
                      />
                    </View>
                    <Text style={[
                      styles.modalChipText,
                      selectedOccasion === occ.key && styles.modalChipTextActive
                    ]}>
                      {occ.label}
                    </Text>
                  </PressScale>
                ))}
              </View>

              <Text style={styles.modalSectionTitle}>Vibe (Optional)</Text>
              <View style={styles.modalGrid}>
                {['Standard', 'Edgy', 'Minimalist', 'Old Money'].map((vibe) => (
                  <PressScale
                    key={vibe}
                    style={[
                      styles.modalChip,
                      { paddingVertical: Layout.spacing.sm },
                      selectedVibe === vibe && styles.modalChipActive
                    ]}
                    onPress={() => setSelectedVibe(vibe)}
                  >
                    <Text style={[
                      styles.modalChipText,
                      selectedVibe === vibe && styles.modalChipTextActive
                    ]}>
                      {vibe}
                    </Text>
                  </PressScale>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Generate Outfit"
                variant="primary"
                onPress={handleConfirmGenerate}
                icon={<Ionicons name="sparkles" size={18} color={theme.onPrimary} />}
                style={styles.generateActionButton}
              />
            </View>
          </View>
        </BlurView>
      </Modal>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: theme.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatorCard: {
    marginBottom: Layout.spacing.xl,
  },
  generatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  generatorText: {
    flex: 1,
  },
  generatorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  generatorSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: Layout.spacing.md,
  },
  occasionsContainer: {
    gap: Layout.spacing.sm,
    paddingBottom: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  occasionChip: {
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
  occasionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  generateButton: {
    marginBottom: Layout.spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  outfitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  outfitCard: {
    width: cardWidth,
    backgroundColor: theme.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  outfitPreview: {
    position: 'relative',
    aspectRatio: 3 / 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.surfaceElevated,
  },
  outfitOverlay: {
    position: 'absolute',
    top: Layout.spacing.sm,
    right: Layout.spacing.sm,
  },
  occasionBadge: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 4,
    borderRadius: 4,
  },
  occasionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  outfitInfo: {
    padding: Layout.spacing.md,
  },
  outfitInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  outfitName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  outfitTime: {
    fontSize: 12,
    color: theme.textMuted,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  featureCard: {
    width: cardWidth,
    alignItems: 'center',
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13, 30, 179, 0.63)',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: Layout.borderRadius.xl * 1.5,
    borderTopRightRadius: Layout.borderRadius.xl * 1.5,
    paddingTop: Layout.spacing.sm,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginBottom: Layout.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingBottom: Layout.spacing.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  modalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: '48%',
    flex: 1,
  },
  modalChipActive: {
    backgroundColor: theme.primaryMuted,
    borderColor: theme.primary,
  },
  modalChipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  modalChipIconContainerActive: {
    backgroundColor: theme.background,
  },
  modalChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  modalChipTextActive: {
    color: theme.primary,
  },
  modalFooter: {
    padding: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xxl,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.surface,
  },
  generateActionButton: {
    borderRadius: Layout.borderRadius.full,
    height: 56,
  },
});
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui/Text';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/subscription';

interface UsageIndicatorProps {
  type: 'wardrobe' | 'outfit';
  showUpgradeBtn?: boolean;
}

export function UsageIndicator({ type, showUpgradeBtn = true }: UsageIndicatorProps) {
  const { theme } = useTheme();
  const { usage, subscriptionTier, isLoading } = useSubscription();

  if (!usage) {
    return null;
  }

  const data = type === 'wardrobe' ? usage.wardrobe : usage.outfit;
  const label = type === 'wardrobe' ? 'Wardrobe Items' : 'Outfit Looks';
  const limit = data.limit;
  const used = data.used;
  const remaining = data.remaining;

  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(1, used / limit);

  // Determine progress bar and text color
  let barColor = theme.primary;
  if (!isUnlimited && percentage >= 0.9) {
    barColor = theme.danger;
  } else if (!isUnlimited && percentage >= 0.75) {
    barColor = theme.warning;
  }

  const handleUpgrade = () => {
    router.push('/paywall');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name={type === 'wardrobe' ? 'shirt-outline' : 'albums-outline'}
            size={16}
            color={theme.textSecondary}
          />
          <Text variant="caption" style={[styles.label, { color: theme.textSecondary }]}>
            {label}
          </Text>
        </View>
        <Text variant="caption" style={styles.countText}>
          {isUnlimited ? `${used} generated` : `${used} / ${limit}`}
        </Text>
      </View>

      {!isUnlimited && (
        <View style={[styles.progressTrack, { backgroundColor: theme.divider }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percentage * 100}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
      )}

      {/* Warning/Status Info or Upgrade CTA */}
      <View style={styles.footer}>
        {isUnlimited ? (
          <View style={styles.tierInfo}>
            <Ionicons name="sparkles" size={12} color={theme.accent} />
            <Text variant="caption" style={{ color: theme.accent, fontFamily: 'Inter-SemiBold', fontSize: 12 }}>
              Elite Unlimited Access
            </Text>
          </View>
        ) : percentage >= 0.8 ? (
          <Text variant="caption" style={{ color: theme.danger, fontSize: 12 }}>
            Running low! {remaining} left.
          </Text>
        ) : (
          <Text variant="caption" style={{ color: theme.textMuted, fontSize: 12 }}>
            Resets on 1st of next month
          </Text>
        )}

        {showUpgradeBtn && subscriptionTier !== 'premium' && (
          <Pressable onPress={handleUpgrade} style={styles.upgradeBtn}>
            <Text variant="caption" style={[styles.upgradeBtnText, { color: theme.primary }]}>
              {subscriptionTier === 'free' ? 'Upgrade' : 'Go Elite'}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={theme.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'Inter-Medium',
  },
  countText: {
    fontFamily: 'Inter-SemiBold',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  upgradeBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
});

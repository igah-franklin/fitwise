import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/subscription';
import api from '@/lib/api';
import { trackEvent } from '@/lib/posthog';

export default function PaywallScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { offerings, purchasePackage, restorePurchases, refreshSubscription, subscriptionTier } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium'>('pro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    trackEvent('paywall_viewed', { currentTier: subscriptionTier });
  }, []);

  // Define features list for Pro
  const proFeatures = [
    'Generate up to 150 wardrobe items/mo',
    'Generate up to 100 outfits/mo',
    'Smart AI budget styling advice',
    'Full access to all style categories',
    'Save and organize your outfits',
  ];

  // Define features list for Premium
  const premiumFeatures = [
    'UNLIMITED wardrobe items generation',
    'UNLIMITED outfits generation',
    'Highest priority AI generation speed',
    'Exclusive premium outfit ideas',
    'Early access to new styling features',
  ];

  // Map tier to packaging info
  const handleSubscribe = async () => {
    setIsSubmitting(true);
    trackEvent('subscription_purchase_initiated', { plan: selectedPlan });
    try {
      // Find RevenueCat package from current offering or fallback to 'subscriptions' identifier
      let packageToPurchase = null;
      const activeOffering = offerings?.current || offerings?.all?.['subscriptions'];

      if (activeOffering) {
        const packageId = selectedPlan === 'pro' ? 'pro_monthly' : 'premium_monthly';
        packageToPurchase = activeOffering.availablePackages.find(
          (pkg: any) => pkg.identifier === packageId || pkg.product.identifier.includes(selectedPlan)
        );
      }

      if (packageToPurchase) {
        const success = await purchasePackage(packageToPurchase);
        if (success) {
          trackEvent('subscription_purchase_success', { plan: selectedPlan, method: 'revenuecat' });
          Alert.alert('Success', `Welcome to WearThis ${selectedPlan.toUpperCase()}!`);
          router.back();
        } else {
          trackEvent('subscription_purchase_failed', { plan: selectedPlan, reason: 'cancelled or failed' });
          Alert.alert('Error', 'Purchase could not be completed.');
        }
      } else {
        trackEvent('subscription_purchase_failed', { plan: selectedPlan, reason: 'offering not found' });
        Alert.alert('Error', 'This subscription option is currently unavailable. Please try again later.');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      trackEvent('subscription_purchase_failed', { plan: selectedPlan, reason: error.message || 'unknown' });
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert('Restored', 'Your purchases have been successfully restored.');
        router.back();
      } else {
        Alert.alert('Restoration Failed', 'No active subscription entitlements found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not restore purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Glow */}
      <View style={styles.glowTop}>
        <LinearGradient
          colors={[theme.primaryMuted, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header Bar */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: theme.surfaceElevated }]}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text variant="h3" style={styles.headerTitle}>WearThis Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introContainer}>
          <Text variant="h2" style={styles.title}>Elevate Your Style</Text>
          <Text variant="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock unlimited AI power, smart budget suggestions, and build a world-class wardrobe.
          </Text>
        </View>

        {/* Current Status Badge if Subscribed */}
        {subscriptionTier !== 'free' && (
          <View style={[styles.activeTierBadge, { backgroundColor: theme.primaryMuted, borderColor: theme.primary }]}>
            <Ionicons name="sparkles" size={16} color={theme.primary} />
            <Text style={[styles.activeTierText, { color: theme.primary }]}>
              Current Plan: WearThis {subscriptionTier.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {/* Pro Card */}
          <Pressable
            onPress={() => setSelectedPlan('pro')}
            style={[
              styles.planCard,
              {
                backgroundColor: theme.surface,
                borderColor: selectedPlan === 'pro' ? theme.primary : theme.border,
              },
            ]}
          >
            {selectedPlan === 'pro' && (
              <View style={[styles.selectedCheck, { backgroundColor: theme.primary }]}>
                <Ionicons name="checkmark" size={12} color={theme.onPrimary} />
              </View>
            )}
            <View style={styles.planCardHeader}>
              <View>
                <Text variant="h3" style={styles.planTitle}>WearThis Pro</Text>
                <Text variant="caption" style={{ color: theme.textMuted }}>Best for starters</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text variant="h2" style={styles.price}>$9.99</Text>
                <Text variant="caption" style={styles.priceDuration}>/mo</Text>
              </View>
            </View>
          </Pressable>

          {/* Premium Card */}
          <Pressable
            onPress={() => setSelectedPlan('premium')}
            style={[
              styles.planCard,
              {
                backgroundColor: theme.surface,
                borderColor: selectedPlan === 'premium' ? theme.accent : theme.border,
              },
            ]}
          >
            {selectedPlan === 'premium' && (
              <View style={[styles.selectedCheck, { backgroundColor: theme.accent }]}>
                <Ionicons name="checkmark" size={12} color="#000" />
              </View>
            )}
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>UNLIMITED</Text>
            </View>
            <View style={styles.planCardHeader}>
              <View>
                <Text variant="h3" style={styles.planTitle}>WearThis Elite</Text>
                <Text variant="caption" style={{ color: theme.textMuted }}>For fashion leaders</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text variant="h2" style={[styles.price, { color: theme.accent }]}>$49.99</Text>
                <Text variant="caption" style={styles.priceDuration}>/mo</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Feature List */}
        <View style={[styles.featuresContainer, { backgroundColor: theme.surface }]}>
          <Text variant="h3" style={styles.featuresHeading}>
            What's included in {selectedPlan === 'pro' ? 'WearThis Pro' : 'WearThis Elite'}
          </Text>
          {(selectedPlan === 'pro' ? proFeatures : premiumFeatures).map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <View style={[
                styles.featureIconContainer,
                { backgroundColor: selectedPlan === 'pro' ? theme.primaryMuted : 'rgba(74, 222, 128, 0.16)' }
              ]}>
                <Ionicons
                  name="checkmark-sharp"
                  size={16}
                  color={selectedPlan === 'pro' ? theme.primary : theme.accent}
                />
              </View>
              <Text variant="body" style={[styles.featureText, { color: theme.textSecondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Restore Action */}
        <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restoreLink}>
          {isRestoring ? (
            <ActivityIndicator size="small" color={theme.textMuted} />
          ) : (
            <Text variant="caption" style={{ color: theme.textMuted, textDecorationLine: 'underline' }}>
              Restore purchases
            </Text>
          )}
        </Pressable>

        {/* Privacy & Terms */}
        <Text variant="caption" style={[styles.legalText, { color: theme.textMuted }]}>
          Subscriptions will automatically renew monthly. You can cancel anytime in your Google Play or Apple App Store account settings. By upgrading, you agree to our Terms of Use and Privacy Policy.
        </Text>
      </ScrollView>

      {/* Floating Action CTA Button */}
      <View style={[styles.footerButtonContainer, { paddingBottom: insets.bottom + 16, backgroundColor: theme.background }]}>
        <Button
          title={isSubmitting ? 'Processing...' : `Upgrade to ${selectedPlan === 'pro' ? 'Pro' : 'Elite'}`}
          onPress={handleSubscribe}
          loading={isSubmitting}
          style={selectedPlan === 'premium' ? { backgroundColor: theme.accent } : undefined}
          textStyle={selectedPlan === 'premium' ? { color: '#000' } : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  introContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  activeTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 24,
    gap: 8,
  },
  activeTierText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 28,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    position: 'relative',
  },
  selectedCheck: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#FF6B5E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
  },
  priceDuration: {
    color: '#94A3B8',
    marginLeft: 2,
  },
  featuresContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(259, 259, 259, 0.05)',
    marginBottom: 24,
  },
  featuresHeading: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  restoreLink: {
    alignSelf: 'center',
    padding: 8,
    marginBottom: 16,
  },
  legalText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  footerButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(259, 259, 259, 0.05)',
  },
});

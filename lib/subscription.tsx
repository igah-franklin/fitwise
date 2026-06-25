import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import api from './api';
import { useAuth } from './AuthContext';

declare const process: any;

export interface UsageDetail {
  used: number;
  limit: number;
  remaining: number;
}

export interface UsageSummary {
  tier: 'free' | 'pro' | 'premium';
  period: string;
  wardrobe: UsageDetail;
  outfit: UsageDetail;
}

interface SubscriptionContextType {
  subscriptionTier: 'free' | 'pro' | 'premium';
  usage: UsageSummary | null;
  offerings: any | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  purchasePackage: (pkg: any) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
  android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
}) || '';

const isWeb = Platform.OS === 'web';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'premium'>('free');
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [offerings, setOfferings] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch usage stats from backend (with optional polling retry if webhook is delayed)
  const fetchUsageSummary = useCallback(async (retryCount = 0): Promise<void> => {
    if (!user) return;
    try {
      const res = await api.get('/subscription/status');
      const backendTier = res.data.tier;

      // If we are on native and have active entitlements locally, but the backend still reports 'free',
      // poll the backend status with a brief delay to wait for the RevenueCat webhook to finish.
      if (!isWeb && REVENUECAT_API_KEY && !REVENUECAT_API_KEY.includes('your_revenuecat')) {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          const localActiveEntitlements = Object.keys(customerInfo?.entitlements?.active || {});

          if (localActiveEntitlements.length > 0 && backendTier === 'free' && retryCount < 4) {
            console.log(`[Subscription] Webhook lag detected (local active entitlements: ${localActiveEntitlements.join(', ')}, backend tier: ${backendTier}). Retrying sync in 1.5s... (Attempt ${retryCount + 1}/4)`);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return fetchUsageSummary(retryCount + 1);
          }
        } catch (err) {
          console.warn('[Subscription] Failed to check local entitlements during sync:', err);
        }
      }

      setUsage(res.data);
      setSubscriptionTier(backendTier);
    } catch (error) {
      console.warn('Failed to fetch subscription usage from backend:', error);
    }
  }, [user]);

  // Fetch offerings from RevenueCat
  const fetchOfferings = useCallback(async () => {
    if (isWeb || !REVENUECAT_API_KEY || REVENUECAT_API_KEY.includes('your_revenuecat')) {
      console.log('Skipping RevenueCat offerings fetch: Web or placeholder API key');
      return;
    }
    try {
      const currentOfferings = await Purchases.getOfferings();
      setOfferings(currentOfferings);

      // Send debug log to backend
      api.post('/debug-log', {
        offerings: currentOfferings,
        platform: Platform.OS,
        userId: user?._id || 'anonymous',
      }).catch((err) => console.warn('Failed to send debug log to backend:', err));
    } catch (error: any) {
      console.warn('Failed to fetch RevenueCat offerings:', error);

      // Send error debug log to backend
      api.post('/debug-log', {
        error: error?.message || String(error),
        platform: Platform.OS,
        userId: user?._id || 'anonymous',
      }).catch((err) => console.warn('Failed to send debug log to backend:', err));
    }
  }, [user]);

  const refreshSubscription = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchUsageSummary(), fetchOfferings()]);
    setIsLoading(false);
  }, [fetchUsageSummary, fetchOfferings]);

  // Configure RevenueCat on user change
  useEffect(() => {
    const setupPurchases = async () => {
      if (user) {
        setIsLoading(true);
        if (!isWeb && REVENUECAT_API_KEY && !REVENUECAT_API_KEY.includes('your_revenuecat')) {
          try {
            // Configure Purchases
            await Purchases.configure({
              apiKey: REVENUECAT_API_KEY,
              appUserID: user._id,
            });
            console.log('RevenueCat configured successfully for user:', user._id);
          } catch (error) {
            console.warn('Failed to configure RevenueCat:', error);
          }
        }
        await Promise.all([fetchUsageSummary(), fetchOfferings()]);
        setIsLoading(false);
      } else {
        setSubscriptionTier('free');
        setUsage(null);
        setOfferings(null);
        setIsLoading(false);
        if (!isWeb && REVENUECAT_API_KEY && !REVENUECAT_API_KEY.includes('your_revenuecat')) {
          try {
            await Purchases.logOut();
          } catch (error) {
            console.warn('Failed to logout of RevenueCat:', error);
          }
        }
      }
    };

    setupPurchases();
  }, [user, fetchUsageSummary, fetchOfferings]);

  // Purchase package
  const purchasePackage = async (pkg: any): Promise<boolean> => {
    if (isWeb || !REVENUECAT_API_KEY || REVENUECAT_API_KEY.includes('your_revenuecat')) {
      console.warn('Cannot purchase: Web platform or invalid RevenueCat API key.');
      return false;
    }
    try {
      const purchaseResult = await Purchases.purchasePackage(pkg);
      // console.log(purchaseResult, 'purchaseResult')
      const activeEntitlements = Object.keys(purchaseResult.customerInfo?.entitlements?.active || {});
      // console.log(activeEntitlements, 'activeEntitlements')
      if (activeEntitlements.length > 0) {
        // Refresh subscription after purchase (polls backend status)
        await refreshSubscription();
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase flow.');
      } else {
        console.error('Purchase error:', error);
      }
      return false;
    }
  };

  // Restore purchases
  const restorePurchases = async (): Promise<boolean> => {
    if (isWeb || !REVENUECAT_API_KEY || REVENUECAT_API_KEY.includes('your_revenuecat')) {
      console.warn('Cannot restore: Web platform or invalid RevenueCat API key.');
      return false;
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      const activeEntitlements = Object.keys(customerInfo?.entitlements?.active || {});
      if (activeEntitlements.length > 0) {
        await refreshSubscription();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionTier,
        usage,
        offerings,
        isLoading,
        refreshSubscription,
        purchasePackage,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

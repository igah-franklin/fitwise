import PostHog from 'posthog-react-native';

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Initialize PostHog client.
// If the API key is not present, PostHog defaults to a safe mock/no-op mode.
export const posthog = new PostHog(posthogApiKey || 'noop', {
  host: posthogHost,
});

/**
 * Capture an analytics event to PostHog.
 * Logs events to console when in dev mode for easy testing.
 */
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  try {
    if (posthogApiKey && posthogApiKey !== 'noop') {
      posthog.capture(event, properties);
    }
    if (__DEV__) {
      console.log(`[PostHog] Event: "${event}" | Properties:`, properties);
    }
  } catch (error) {
    console.error('Error capturing event in PostHog helper:', error);
  }
};

/**
 * Identify a user in PostHog and associate their traits.
 */
export const identifyUser = (
  userId: string,
  email: string,
  name?: string,
  subscriptionTier?: string
) => {
  try {
    if (posthogApiKey && posthogApiKey !== 'noop') {
      const traits: Record<string, any> = { email };
      if (name) traits.name = name;
      if (subscriptionTier) traits.subscriptionTier = subscriptionTier;
      
      posthog.identify(userId, traits);
    }
    if (__DEV__) {
      console.log(`[PostHog] Identify: "${userId}" | Email: "${email}" | Subscription: "${subscriptionTier}"`);
    }
  } catch (error) {
    console.error('Error identifying user in PostHog helper:', error);
  }
};

/**
 * Reset PostHog session identity (e.g. on logout).
 */
export const resetUser = () => {
  try {
    if (posthogApiKey && posthogApiKey !== 'noop') {
      posthog.reset();
    }
    if (__DEV__) {
      console.log('[PostHog] Reset User Identity');
    }
  } catch (error) {
    console.error('Error resetting user identity in PostHog helper:', error);
  }
};

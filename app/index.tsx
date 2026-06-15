import { Redirect } from 'expo-router';
import { useOnboarded } from './_layout';
import { useAuth } from '@/lib/AuthContext';
import { useProfile, isProfileHydrated } from '@/lib/profile';

export default function Index() {
  const { isOnboarded } = useOnboarded();
  const { user } = useAuth();
  // Subscribing keeps this re-rendering as the profile hydrates.
  const profile = useProfile();

  // The root layout holds the splash screen until this is resolved, so by the
  // time Index renders we always have a definitive value. A single declarative
  // redirect avoids the tabs -> onboarding flicker.
  if (isOnboarded === null) {
    return null;
  }

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Wait until we know whether the user has a profile before deciding where to
  // land — avoids briefly showing the home tabs to someone who hasn't finished
  // setup. AuthGuard keeps this enforced for any later navigation too.
  if (!isProfileHydrated()) {
    return null;
  }

  // Gate the home screen behind a completed setup form. Those details are reused
  // to prefill the form for future generations.
  if (!profile?.completedAt) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(tabs)" />;
}

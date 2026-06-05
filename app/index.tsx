import { Redirect } from 'expo-router';
import { useOnboarded } from './_layout';

export default function Index() {
  const isOnboarded = useOnboarded();

  // The root layout holds the splash screen until this is resolved, so by the
  // time Index renders we always have a definitive value. A single declarative
  // redirect avoids the tabs -> onboarding flicker.
  if (isOnboarded === null) {
    return null;
  }

  return <Redirect href={isOnboarded ? '/(tabs)' : '/onboarding'} />;
}

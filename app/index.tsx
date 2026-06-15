// Root index — simply renders null.
// All navigation decisions (onboarding → auth → setup → tabs) are handled
// exclusively by AuthGuard in _layout.tsx to avoid competing redirects that
// cause infinite-loop crashes.

export default function Index() {
  return null;
}

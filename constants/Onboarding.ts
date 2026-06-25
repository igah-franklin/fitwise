// Onboarding design tokens for the AI men's style app

export const ONBOARDING_SLIDES = [
  {
    background: ['#02033b', '#0b165c', '#02033b'] as const,
    backgroundLocations: [0, 0.5, 1] as const,
    headline: '#F7F5F2',
    subtitle: 'rgba(247,245,242,0.75)',
    accent: ['#818CF8', '#4F46E5'] as const,
    accentSolid: '#818CF8',
  },
  {
    background: ['#02033b', '#1e0c4a', '#02033b'] as const,
    backgroundLocations: [0, 0.5, 1] as const,
    headline: '#F7F5F2',
    subtitle: 'rgba(247,245,242,0.72)',
    accent: ['#F472B6', '#DB2777'] as const,
    accentSolid: '#F472B6',
  },
  {
    background: ['#02033b', '#0c2452', '#02033b'] as const,
    backgroundLocations: [0, 0.5, 1] as const,
    headline: '#F7F5F2',
    subtitle: 'rgba(247,245,242,0.74)',
    accent: ['#34D399', '#059669'] as const,
    accentSolid: '#34D399',
  },
] as const;

export const ONBOARDING_CHROME = {
  dotInactive: 'rgba(255,255,255,0.15)',
  dotActive: '#818CF8',
  backButtonBg: 'rgba(255,255,255,0.06)',
  backButtonBorder: 'rgba(255,255,255,0.12)',
  backButtonIcon: 'rgba(255,255,255,0.80)',
  iconButtonShadow: 'rgba(0,0,0,0.45)',
  skipTextOpacity: 0.70,
} as const;
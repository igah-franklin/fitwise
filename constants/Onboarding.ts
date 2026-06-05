// Onboarding design tokens for the AI men's style app

export const ONBOARDING_SLIDES = [
  {
    background: ['#1a2642', '#2c4a75', '#1e3153'] as const,
    backgroundLocations: [0, 0.4, 1] as const,
    headline: '#F7F5F2',
    subtitle: 'rgba(247,245,242,0.72)',
    accent: ['#5B9FE8', '#2C5282'] as const,
    accentSolid: '#5B9FE8',
  },
  {
    background: ['#2d1810', '#4a3222', '#3a2518'] as const,
    backgroundLocations: [0, 0.5, 1] as const,
    headline: '#F7F5F2',
    subtitle: 'rgba(247,245,242,0.68)',
    accent: ['#E6A84B', '#C77E2C'] as const,
    accentSolid: '#E6A84B',
  },
  {
    background: ['#0f1a2e', '#1e2d4f', '#162340'] as const,
    backgroundLocations: [0, 0.6, 1] as const,
    headline: '#F7F5F2',
    subtitle: 'rgba(247,245,242,0.70)',
    accent: ['#5B9FE8', '#2C5282'] as const,
    accentSolid: '#5B9FE8',
  },
] as const;

export const ONBOARDING_CHROME = {
  dotInactive: 'rgba(247,245,242,0.20)',
  dotActive: '#5B9FE8',
  backButtonBg: 'rgba(247,245,242,0.08)',
  backButtonBorder: 'rgba(247,245,242,0.16)',
  backButtonIcon: 'rgba(247,245,242,0.78)',
  iconButtonShadow: 'rgba(0,0,0,0.35)',
  skipTextOpacity: 0.65,
} as const;
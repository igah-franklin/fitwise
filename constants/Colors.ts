/**
 * Canonical 17-token color schema. The AI-generated apps overwrite this with
 * their locked design brief palette. The shape MUST stay consistent with
 * `PaletteScheme` in the backend (designPalettes.ts) so the same screen
 * code works against either the template defaults or a generated palette.
 */

export const Colors = {
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceElevated: '#F3F4F6',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    primary: '#6366F1',
    primaryMuted: 'rgba(99, 102, 241, 0.10)',
    onPrimary: '#FFFFFF',
    accent: '#22C55E',
    success: '#15A36B',
    warning: '#D78813',
    danger: '#D8392B',
    info: '#1F6FEB',
    border: 'rgba(15, 23, 42, 0.10)',
    borderStrong: 'rgba(15, 23, 42, 0.20)',
    divider: 'rgba(15, 23, 42, 0.06)',
  },
  dark: {
    background: '#0A0F1C',
    surface: '#111827',
    surfaceElevated: '#1E293B',
    text: '#F9FAFB',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    primary: '#818CF8',
    primaryMuted: 'rgba(129, 140, 248, 0.16)',
    onPrimary: '#0A0F1C',
    accent: '#4ADE80',
    success: '#3CCB8E',
    warning: '#FFC663',
    danger: '#FF6B5E',
    info: '#73A0FF',
    border: 'rgba(249, 250, 251, 0.10)',
    borderStrong: 'rgba(249, 250, 251, 0.20)',
    divider: 'rgba(249, 250, 251, 0.06)',
  },
};

export type ColorScheme = typeof Colors.light;

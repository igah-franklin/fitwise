import React from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { THEME } from '@/lib/theme';

interface CustomTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
}

export function Text({
  variant = 'body',
  style,
  children,
  ...props
}: CustomTextProps) {
  return (
    <RNText style={[variantStyles[variant], style as TextStyle]} {...props}>
      {children}
    </RNText>
  );
}

const variantStyles = StyleSheet.create({
  h1: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: THEME.text,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: THEME.text,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: THEME.text,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: THEME.textSecondary ?? THEME.text,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: THEME.textMuted ?? '#9CA3AF',
  },
});

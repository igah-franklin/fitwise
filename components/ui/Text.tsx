import React from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/lib/theme';

interface CustomTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
}

export function Text({
  variant = 'body',
  style,
  children,
  ...props
}: CustomTextProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <RNText style={[styles[variant], style as TextStyle]} {...props}>
      {children}
    </RNText>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  h1: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: theme.text,
  },
  h3: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: theme.text,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: theme.textSecondary ?? theme.text,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: theme.textMuted ?? '#9CA3AF',
  },
});

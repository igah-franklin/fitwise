import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { THEME } from '@/lib/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const buttonStyle: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    variantStyles[variant],
    (disabled || loading) && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  return (
    <TouchableOpacity
      style={[...buttonStyle, style as ViewStyle]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? (THEME.onPrimary ?? '#FFFFFF') : THEME.primary}
          size="small"
          style={icon || loading ? styles.iconSpacing : undefined}
        />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      <Text style={[
        styles.text,
        sizeText[size],
        variantText[variant],
        (icon || loading) ? styles.textWithIcon : undefined
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
  },
  textWithIcon: {
    marginLeft: 8,
  },
  iconSpacing: {
    marginRight: 8,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  md: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  lg: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
});

const sizeText = StyleSheet.create({
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: THEME.primary },
  secondary: { backgroundColor: THEME.surface ?? '#F3F4F6' },
  ghost: { backgroundColor: 'transparent' },
});

const variantText = StyleSheet.create({
  primary: { color: THEME.onPrimary ?? '#FFFFFF' },
  secondary: { color: THEME.text },
  ghost: { color: THEME.primary },
});

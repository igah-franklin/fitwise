import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/lib/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  textStyle?: TextStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const variantStyles = makeVariantStyles(theme);
  const variantText = makeVariantText(theme);

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
          color={variant === 'primary' ? (theme.onPrimary ?? '#FFFFFF') : theme.primary}
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
        (icon || loading) ? styles.textWithIcon : undefined,
        textStyle,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
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

const makeVariantStyles = (theme: any) => StyleSheet.create({
  primary: { backgroundColor: theme.primary },
  secondary: { backgroundColor: theme.surface ?? '#F3F4F6' },
  ghost: { backgroundColor: 'transparent' },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
});

const makeVariantText = (theme: any) => StyleSheet.create({
  primary: { color: theme.onPrimary ?? '#FFFFFF' },
  secondary: { color: theme.text },
  ghost: { color: theme.primary },
  outline: { color: theme.text },
});

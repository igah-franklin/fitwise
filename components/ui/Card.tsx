import React from 'react';
import { View, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme';

interface CardProps extends ViewProps {
  shadow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingValues = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
};

export function Card({
  shadow = true,
  padding = 'md',
  style,
  children,
  ...props
}: CardProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View
      style={[
        styles.card,
        { padding: paddingValues[padding] },
        shadow && styles.shadow,
        style as ViewStyle,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.surface ?? '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border ?? '#F1F5F9',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
});

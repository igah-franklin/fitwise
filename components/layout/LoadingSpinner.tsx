import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { THEME } from '@/lib/theme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ message, size = 'large' }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={THEME.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: THEME.textMuted ?? '#9CA3AF',
    marginTop: 12,
  },
});

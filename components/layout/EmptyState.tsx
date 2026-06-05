import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { THEME } from '@/lib/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={THEME.textMuted ?? '#D1D5DB'} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionTitle && onAction && (
        <Button title={actionTitle} variant="primary" size="sm" onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: THEME.text,
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: THEME.textMuted ?? '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
  },
});

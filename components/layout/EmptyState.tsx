import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/lib/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'shirt-outline',
  title,
  message,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={theme.textMuted ?? '#D1D5DB'} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionTitle && onAction && (
        <Button title={actionTitle} variant="primary" size="sm" onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
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
    color: theme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: theme.textMuted ?? '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
  },
});

import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { PressScale } from '@/components/ui/Motion';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';

interface ConfirmDeleteModalProps {
  visible: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  visible,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <BlurView intensity={20} tint="default" style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="trash-outline" size={32} color={theme.danger} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          
          <Text style={styles.message}>
            {message}
            {itemName ? (
              <Text style={{ fontWeight: '700', color: theme.text }}>
                {'\n'}"{itemName}"
              </Text>
            ) : null}
          </Text>

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              style={[styles.button, styles.cancelButton]}
            />
            <Button
              title={isDeleting ? 'Deleting...' : 'Delete'}
              variant="primary"
              onPress={onConfirm}
              loading={isDeleting}
              style={[styles.button, styles.deleteButton]}
              // we can style the button red if we want, but variant="primary" is fine, let's override color
              textStyle={{ color: '#fff' }}
            />
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
    backgroundColor: 'rgba(115, 123, 192, 0.14)',
  },
  container: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light red background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    borderColor: theme.border,
  },
  deleteButton: {
    backgroundColor: theme.danger,
    borderColor: theme.danger,
  },
});

import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';
import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image';

interface ConfirmSwapModalProps {
  visible: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSwapping?: boolean;
}

export function ConfirmSwapModal({
  visible,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isSwapping = false,
}: ConfirmSwapModalProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  // Reanimated spin animation for the loader
  const spin = useSharedValue(0);

  useEffect(() => {
    if (visible && isSwapping) {
      spin.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      spin.value = 0;
    }
  }, [visible, isSwapping, spin]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={isSwapping ? undefined : onCancel}
    >
      <BlurView intensity={20} tint="default" style={styles.overlay}>
        <View style={styles.container}>
          {isSwapping ? (
            // Loading State
            <View style={styles.loadingContainer}>
              <Animated.View style={[styles.iconContainer, styles.loaderIconContainer, spinStyle]}>
                <Ionicons name="sync-outline" size={36} color={theme.primary} />
              </Animated.View>
              <Text style={styles.title}>Swapping Item...</Text>
              <Text style={styles.message}>
                Analyzing your preferences and generating a new personalized piece. This may take a moment.
              </Text>
            </View>
          ) : (
            // Confirmation State
            <>
              {/* <View style={[styles.iconContainer, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name="sparkles-outline" size={32} color={theme.primary} />
              </View> */}
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/adaptive-icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
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
                  title="Swap"
                  variant="primary"
                  onPress={onConfirm}
                  style={[styles.button, styles.swapButton]}
                />
              </View>
            </>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Layout.spacing.xl,
      backgroundColor: 'rgba(115, 123, 192, 0.14)',
    },
    container: {
      width: '100%',
      backgroundColor: theme.surface ?? '#FFFFFF',
      borderRadius: Layout.borderRadius.xl,
      padding: Layout.spacing.xl,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    logoContainer: {
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    logo: {
      width: 90,
      height: 90,
      tintColor: Colors.light.primary,
    },
    loadingContainer: {
      alignItems: 'center',
      width: '100%',
      paddingVertical: Layout.spacing.md,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Layout.spacing.lg,
    },
    loaderIconContainer: {
      backgroundColor: 'transparent',
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
    swapButton: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
  });

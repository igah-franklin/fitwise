import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/lib/theme';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function VerifiedScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  return (
    <Screen>
      <View style={styles.container}>
        {/* Glow Halo */}
        <Animated.View entering={ZoomIn.duration(600).delay(200)} style={styles.iconContainer}>
          <LinearGradient
            colors={['#4299E1', '#3182CE']}
            style={styles.iconGradient}
          >
            <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.textContainer}>
          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.subtitle}>
            Your email has been successfully verified. You are now ready to log in and start curating your capsule wardrobe.
          </Text>
        </Animated.View>

        {/* Action Button */}
        <Animated.View entering={FadeInUp.duration(600).delay(600)} style={styles.buttonContainer}>
          <Button
            title="Log In to WearThis"
            variant="primary"
            style={styles.loginButton}
            onPress={() => router.replace('/(auth)/login')}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: '#3182CE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.textSecondary || theme.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  buttonContainer: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 14,
  },
});

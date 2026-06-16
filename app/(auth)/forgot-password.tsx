import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import api from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendResetCode = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await api.post('/auth/forgot-password', { email });
      
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email }
      });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <Pressable 
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backCircleButton,
          pressed && styles.pressedState
        ]}
      >
        <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
      </Pressable>

      <View style={styles.container}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a reset code.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input 
          label="Email" 
          placeholder="you@example.com" 
          keyboardType="email-address" 
          value={email} 
          onChangeText={setEmail} 
        />

        <Button 
          title="Send Code" 
          variant="primary" 
          style={styles.actionButton} 
          onPress={handleSendResetCode}
          disabled={isLoading}
        />

        <View style={styles.loginFooterContainer}>
          <Text style={styles.loginFooterText}>Remember your password?</Text>
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.loginFooterButton,
              pressed && styles.loginFooterButtonPressed
            ]}
          >
            <Text style={styles.loginFooterButtonText}>Back to Login</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: Colors.light.textMuted,
    marginBottom: 32,
  },
  errorText: {
    color: Colors.light.danger,
    marginBottom: 16,
    fontFamily: 'Inter-Medium',
  },
  actionButton: {
    marginTop: 32,
  },
  backCircleButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  pressedState: {
    opacity: 0.7,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  loginFooterContainer: {
    marginTop: 40,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
    paddingTop: 24,
  },
  loginFooterText: {
    color: Colors.light.textMuted,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  loginFooterButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginFooterButtonPressed: {
    opacity: 0.8,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  loginFooterButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});

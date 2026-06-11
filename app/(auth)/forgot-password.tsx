import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import api from '@/lib/api';

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
        <Button 
          title="Back to Login" 
          variant="ghost" 
          style={styles.backButton} 
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  backButton: {
    marginTop: 12,
  },
});

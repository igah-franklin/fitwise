import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn } = useAuth();
  
  const email = (params.email as string) || '';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const res = await api.post('/auth/verify-email', { email, code });
      
      // Log the user in upon successful verification
      await signIn(res.data.token, res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      setError('');
      await api.post('/auth/resend-verification', { email });
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input 
          label="Verification Code" 
          placeholder="123456" 
          keyboardType="number-pad" 
          maxLength={6}
          value={code} 
          onChangeText={setCode} 
        />

        <Button 
          title="Verify" 
          variant="primary" 
          style={styles.actionButton} 
          onPress={handleVerify}
          disabled={isLoading}
        />
        <Button 
          title="Resend Code" 
          variant="ghost" 
          style={styles.backButton} 
          onPress={handleResend}
          disabled={isLoading}
        />
        <Button 
          title="Back to Login" 
          variant="ghost" 
          style={styles.backButton} 
          onPress={() => router.replace('/(auth)/login')}
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

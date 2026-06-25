import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import api from '@/lib/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!code || code.length !== 6 || !newPassword) {
      setError('Please provide a valid code and a new password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await api.post('/auth/reset-password', { email, code, newPassword });

      Alert.alert('Success', 'Your password has been reset successfully. Please log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input
          label="Verification Code"
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
        <Input
          label="New Password"
          placeholder="••••••••"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.inputSpacing}
        />

        <Button
          title="Reset Password"
          variant="primary"
          style={styles.actionButton}
          onPress={handleResetPassword}
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
  inputSpacing: {
    marginTop: 16,
  },
  actionButton: {
    marginTop: 32,
  },
  backButton: {
    marginTop: 12,
  },
});

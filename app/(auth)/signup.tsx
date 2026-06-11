import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import api from '@/lib/api';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await api.post('/auth/register', { name, email, password });

      // Navigate to verification screen on success
      router.push({
        pathname: '/(auth)/verify',
        params: { email }
      });
    } catch (e: any) {
      if (e.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection and API URL.');
      } else {
        console.log(e.response.data, 'response****')
        setError(e.response?.data?.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Fitwise today</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input
          label="Full Name"
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.inputSpacing}
        />
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.inputSpacing}
        />

        <Button
          title="Sign Up"
          variant="primary"
          style={styles.actionButton}
          onPress={handleSignUp}
          disabled={isLoading}
          loading={isLoading}
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

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <Input label="Email" placeholder="you@example.com" keyboardType="email-address" />
        <Input label="Password" placeholder="••••••••" secureTextEntry style={styles.passwordInput} />

        <Button title="Sign In" variant="primary" style={styles.signInButton} />
        <Button title="Create Account" variant="ghost" style={styles.createButton} />
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
  passwordInput: {
    marginTop: 16,
  },
  signInButton: {
    marginTop: 24,
  },
  createButton: {
    marginTop: 12,
  },
});

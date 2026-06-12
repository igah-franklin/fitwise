import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
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
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Only take the first character (if user pastes a string, we might want to handle it differently, but for now we'll just handle single key presses)
    const newCode = [...code];
    
    if (text.length > 1) {
      // Handle paste
      const pastedCode = text.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedCode[i] || '';
      }
      setCode(newCode);
      inputRefs.current[Math.min(text.length, 5)]?.focus();
    } else {
      // Handle single input
      newCode[index] = text;
      setCode(newCode);
      
      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const res = await api.post('/auth/verify-email', { email, code: fullCode });
      
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

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
            />
          ))}
        </View>

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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    color: Colors.light.text,
  },
  codeInputFilled: {
    borderColor: Colors.light.primary,
  },
});

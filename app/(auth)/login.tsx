import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'expo-router';
import { trackEvent } from '@/lib/posthog';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleGoogleSignIn(code);
    }
  }, [response]);

  const handleGoogleSignIn = async (code: string) => {
    try {
      const res = await api.post('/auth/google', { 
        code,
        redirectUri: request?.redirectUri,
        codeVerifier: request?.codeVerifier,
        platform: Platform.OS
      });
      await signIn(res.data.token, res.data);
      trackEvent('login_success', { provider: 'google' });
    } catch (error: any) {
      console.error('Google Sign In Failed', error);
      trackEvent('login_failed', { provider: 'google', reason: error.message || 'unknown' });
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      const res = await api.post('/auth/apple', { 
        idToken: credential.identityToken,
        name: credential.fullName?.givenName ? `${credential.fullName.givenName} ${credential.fullName.familyName}` : undefined
      });
      await signIn(res.data.token, res.data);
      trackEvent('login_success', { provider: 'apple' });
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        trackEvent('login_cancelled', { provider: 'apple' });
      } else {
        console.error('Apple Sign In Failed', e);
        trackEvent('login_failed', { provider: 'apple', reason: e.message || 'unknown' });
      }
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.post('/auth/login', { email, password });
      await signIn(res.data.token, res.data);
      trackEvent('login_success', { provider: 'email' });
    } catch (e: any) {
      trackEvent('login_failed', { provider: 'email', reason: e.message || 'unknown' });
      if (e.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection and API URL.');
      } else if (e.response?.status === 403 && e.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        router.push({
          pathname: '/(auth)/verify',
          params: { email }
        });
      } else {
        setError(e.response?.data?.message || 'Login Failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input label="Email" placeholder="you@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input label="Password" placeholder="••••••••" secureTextEntry style={styles.passwordInput} value={password} onChangeText={setPassword} />

        <Button title="Sign In" variant="primary" style={styles.signInButton} onPress={handleEmailSignIn} loading={isLoading} />
        <Button title="Forgot Password?" variant="ghost" style={styles.forgotPasswordButton} onPress={() => router.push('/(auth)/forgot-password')} />
        <Button title="Create Account" variant="ghost" style={styles.createButton} onPress={() => router.push('/(auth)/signup')} />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <Button 
          title="Sign in with Google" 
          variant="outline" 
          onPress={() => promptAsync()} 
          style={styles.socialButton} 
        />
        
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}
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
  passwordInput: {
    marginTop: 16,
  },
  signInButton: {
    marginTop: 24,
  },
  forgotPasswordButton: {
    marginTop: 12,
  },
  createButton: {
    marginTop: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  orText: {
    marginHorizontal: 16,
    color: Colors.light.textMuted,
    fontFamily: 'Inter',
  },
  socialButton: {
    marginBottom: 12,
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
});

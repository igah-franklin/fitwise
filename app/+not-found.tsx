import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen>
        <View style={styles.container}>
          <Text style={styles.emoji}>😕</Text>
          <Text style={styles.title}>Page not found</Text>
          <Text style={styles.message}>
            The screen you're looking for doesn't exist.
          </Text>
          <Link href="/" style={styles.link}>
            Go to home screen
          </Link>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  link: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.light.primary,
  },
});

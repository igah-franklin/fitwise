import React from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/lib/theme';
import { Layout } from '@/constants/Layout';

interface ScreenProps extends ScrollViewProps {
  scroll?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export function Screen({
  scroll = true,
  edges = ['top'],
  style,
  children,
  ...props
}: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.container} edges={edges}>
        <ScrollView
          style={[styles.scroll, style as ViewStyle]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style as ViewStyle]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.padding.screen,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
});

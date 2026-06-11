import React from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
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
  const { theme } = useTheme();
  const styles = makeStyles(theme);
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

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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

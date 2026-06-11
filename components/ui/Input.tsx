import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  style,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [focused, setFocused] = useState(false);

  return (
    <View style={style as ViewStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : undefined,
        ]}
        placeholderTextColor={theme.textMuted ?? '#6B7280'}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.textSecondary ?? '#6B7280',
    marginBottom: 6,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: theme.text,
    backgroundColor: theme.surface ?? '#F9FAFB',
    borderWidth: 1,
    borderColor: theme.border ?? '#E5E7EB',
  },
  inputFocused: {
    borderColor: theme.primary,
  },
  inputError: {
    borderColor: theme.danger ?? '#EF4444',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: theme.danger ?? '#EF4444',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: theme.textMuted ?? '#9CA3AF',
    marginTop: 4,
  },
});

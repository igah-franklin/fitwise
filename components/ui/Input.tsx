import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { THEME } from '@/lib/theme';

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
        placeholderTextColor={THEME.textMuted ?? '#6B7280'}
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

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: THEME.textSecondary ?? '#6B7280',
    marginBottom: 6,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: THEME.text,
    backgroundColor: THEME.surface ?? '#F9FAFB',
    borderWidth: 1,
    borderColor: THEME.border ?? '#E5E7EB',
  },
  inputFocused: {
    borderColor: THEME.primary,
  },
  inputError: {
    borderColor: THEME.danger ?? '#EF4444',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: THEME.danger ?? '#EF4444',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: THEME.textMuted ?? '#9CA3AF',
    marginTop: 4,
  },
});

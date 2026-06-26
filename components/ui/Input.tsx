import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  style,
  ...props
}, ref) => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [focused, setFocused] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useState(props.secureTextEntry);

  return (
    <View style={style as ViewStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        focused && styles.inputFocused,
        error ? styles.inputError : undefined,
      ]}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            props.secureTextEntry && styles.inputWithIcon,
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
          secureTextEntry={props.secureTextEntry ? isPasswordHidden : false}
        />
        {props.secureTextEntry && (
          <Pressable
            style={styles.iconContainer}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
          >
            <Ionicons
              name={isPasswordHidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.textMuted ?? '#9CA3AF'}
            />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
});

const makeStyles = (theme: any) => StyleSheet.create({
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.textSecondary ?? '#6B7280',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface ?? '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border ?? '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter',
    color: theme.text,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
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

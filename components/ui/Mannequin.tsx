import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { Text } from './Text';
import { useTheme } from '@/lib/theme';
import { Layout } from '@/constants/Layout';

interface Measurements {
  height: string;
  weight?: string;
  chest?: string;
  waist: string;
  shoulderWidth: string;
  inseam?: string;
  bust?: string;
  hip?: string;
}

interface MannequinProps {
  gender: 'male' | 'female' | string;
  measurements: Measurements;
  activeField: keyof Measurements | null;
  onSelectField?: (field: keyof Measurements) => void;
}

export function Mannequin({
  gender,
  measurements,
  activeField,
  onSelectField,
}: MannequinProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const isFemale = gender === 'female';

  // Helper to format values
  const getValue = (key: keyof Measurements) => {
    const val = measurements[key];
    return val && val.trim().length > 0 ? `${val} cm` : '-- cm';
  };

  // Badge component for absolute overlays
  const Badge = ({
    fieldKey,
    label,
    style,
  }: {
    fieldKey: keyof Measurements;
    label: string;
    style: any;
  }) => {
    const isActive = activeField === fieldKey;
    const hasValue = measurements[fieldKey] && measurements[fieldKey]!.trim().length > 0;

    return (
      <Pressable
        onPress={() => onSelectField && onSelectField(fieldKey)}
        style={[
          styles.badge,
          style,
          isActive && styles.badgeActive,
          hasValue && !isActive && styles.badgeHasValue,
        ]}
      >
        <Text
          style={[
            styles.badgeLabel,
            isActive && { color: theme.primary },
            hasValue && !isActive && { color: theme.text },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.badgeValue,
            isActive && { color: theme.primary },
            hasValue && !isActive && { color: theme.primary, fontWeight: '700' },
          ]}
        >
          {getValue(fieldKey)}
        </Text>
      </Pressable>
    );
  };

  // Styling for indicator lines
  const getLineProps = (fieldKey: keyof Measurements) => {
    const isActive = activeField === fieldKey;
    const hasValue = measurements[fieldKey] && measurements[fieldKey]!.trim().length > 0;

    return {
      stroke: isActive
        ? theme.primary
        : hasValue
        ? theme.primaryMuted ?? 'rgba(99, 106, 232, 0.4)'
        : theme.border,
      strokeWidth: isActive ? 2.5 : 1.5,
      strokeDasharray: fieldKey === 'height' ? undefined : '3 3',
    };
  };

  return (
    <View style={styles.container}>
      {/* SVG Silhouette and Guides */}
      <Svg width="100%" height="100%" viewBox="0 0 320 320">
        {/* Silhouette body outline */}
        {isFemale ? (
          <>
            {/* Head */}
            <Circle
              cx="160"
              cy="42"
              r="13"
              fill={activeField === 'height' ? `${theme.primary}1A` : `${theme.border}33`}
              stroke={activeField === 'height' ? theme.primary : theme.border}
              strokeWidth={activeField === 'height' ? 2 : 1.5}
            />
            {/* Neck */}
            <Path
              d="M 156 55 L 156 64 L 164 64 L 164 55 Z"
              fill={theme.border}
              opacity={0.3}
            />
            {/* Left Arm */}
            <Path
              d="M 132 72 C 124 110, 120 150, 118 175"
              fill="none"
              stroke={theme.border}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={0.6}
            />
            {/* Right Arm */}
            <Path
              d="M 188 72 C 196 110, 200 150, 202 175"
              fill="none"
              stroke={theme.border}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={0.6}
            />
            {/* Torso & Legs */}
            <Path
              d="M 156 64 L 132 72 C 126 108, 138 155, 122 195 C 128 232, 134 270, 140 305 H 152 C 150 270, 154 232, 160 200 C 166 232, 170 270, 168 305 H 180 C 186 270, 192 232, 198 195 C 182 155, 194 108, 188 72 L 164 64 Z"
              fill={theme.surfaceElevated ?? '#FFFFFF'}
              stroke={theme.border}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            {/* Head */}
            <Circle
              cx="160"
              cy="42"
              r="14"
              fill={activeField === 'height' ? `${theme.primary}1A` : `${theme.border}33`}
              stroke={activeField === 'height' ? theme.primary : theme.border}
              strokeWidth={activeField === 'height' ? 2 : 1.5}
            />
            {/* Neck */}
            <Path
              d="M 155 56 L 155 64 L 165 64 L 165 56 Z"
              fill={theme.border}
              opacity={0.3}
            />
            {/* Left Arm */}
            <Path
              d="M 126 72 C 118 110, 114 150, 112 175"
              fill="none"
              stroke={theme.border}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={0.6}
            />
            {/* Right Arm */}
            <Path
              d="M 194 72 C 202 110, 206 150, 208 175"
              fill="none"
              stroke={theme.border}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={0.6}
            />
            {/* Torso & Legs */}
            <Path
              d="M 156 64 L 126 72 C 130 108, 136 155, 136 195 C 138 232, 138 270, 140 305 H 152 C 150 270, 154 232, 160 195 C 166 232, 170 270, 168 305 H 180 C 182 270, 182 232, 184 195 C 184 155, 190 108, 194 72 L 164 64 Z"
              fill={theme.surfaceElevated ?? '#FFFFFF'}
              stroke={theme.border}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Guides / Lines */}

        {/* Height Guide */}
        <Line x1="60" y1="30" x2="60" y2="305" {...getLineProps('height')} />
        <Line x1="52" y1="30" x2="68" y2="30" {...getLineProps('height')} />
        <Line x1="52" y1="305" x2="68" y2="305" {...getLineProps('height')} />
        <Line x1="60" y1="100" x2="10" y2="100" {...getLineProps('height')} />

        {/* Shoulder Guide */}
        <Line
          x1={isFemale ? '132' : '126'}
          y1="72"
          x2={isFemale ? '188' : '194'}
          y2="72"
          {...getLineProps('shoulderWidth')}
        />
        <Line
          x1={isFemale ? '188' : '194'}
          y1="72"
          x2="245"
          y2="72"
          {...getLineProps('shoulderWidth')}
        />

        {/* Bust/Chest Guide */}
        <Line
          x1={isFemale ? '128' : '130'}
          y1="108"
          x2={isFemale ? '192' : '190'}
          y2="108"
          {...getLineProps(isFemale ? 'bust' : 'chest')}
        />
        <Line
          x1={isFemale ? '192' : '190'}
          y1="108"
          x2="245"
          y2="108"
          {...getLineProps(isFemale ? 'bust' : 'chest')}
        />

        {/* Waist Guide */}
        <Line
          x1={isFemale ? '138' : '136'}
          y1="155"
          x2={isFemale ? '182' : '184'}
          y2="155"
          {...getLineProps('waist')}
        />
        <Line
          x1={isFemale ? '138' : '136'}
          y1="155"
          x2="75"
          y2="155"
          {...getLineProps('waist')}
        />

        {/* Hips Guide (Female only) */}
        {isFemale && (
          <>
            <Line x1="122" y1="195" x2="198" y2="195" {...getLineProps('hip')} />
            <Line x1="198" y1="195" x2="245" y2="195" {...getLineProps('hip')} />
          </>
        )}
      </Svg>

      {/* Badges Overlays */}
      {/* Left side */}
      <Badge fieldKey="height" label="Height" style={styles.leftHeight} />
      <Badge fieldKey="waist" label="Waist" style={styles.leftWaist} />

      {/* Right side */}
      <Badge fieldKey="shoulderWidth" label="Shoulders" style={styles.rightShoulder} />
      {isFemale ? (
        <>
          <Badge fieldKey="bust" label="Bust" style={styles.rightChestBust} />
          <Badge fieldKey="hip" label="Hips" style={styles.rightHip} />
        </>
      ) : (
        <Badge fieldKey="chest" label="Chest" style={styles.rightChestBust} />
      )}
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      width: 320,
      height: 320,
      alignSelf: 'center',
      position: 'relative',
      marginVertical: Layout.spacing.md,
    },
    badge: {
      position: 'absolute',
      backgroundColor: theme.surfaceElevated ?? '#FFFFFF',
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: Layout.borderRadius.sm,
      paddingVertical: 5,
      paddingHorizontal: 8,
      alignItems: 'center',
      minWidth: 72,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    badgeActive: {
      borderColor: theme.primary,
      backgroundColor: theme.surfaceElevated ?? '#FFFFFF',
      shadowColor: theme.primary,
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    badgeHasValue: {
      borderColor: theme.primaryMuted ?? theme.border,
    },
    badgeLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    badgeValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    // Left Overlays
    leftHeight: {
      left: 0,
      top: 85,
    },
    leftWaist: {
      left: 0,
      top: 138,
    },
    // Right Overlays
    rightShoulder: {
      right: 0,
      top: 55,
    },
    rightChestBust: {
      right: 0,
      top: 92,
    },
    rightHip: {
      right: 0,
      top: 178,
    },
  });

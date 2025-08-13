import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export default function BSButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={[styles.text, variantText[variant]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

/** Design tokens — change here, app updates everywhere */
export const theme = {
  colors: {
    primary: '#FFD700',   // gold
    secondary: '#2f95dc', // blue
    danger: '#ff4444',
    textDark: '#000',
    textLight: '#fff',
  },
  radius: 12,
  paddingY: { sm: 8, md: 12, lg: 16 },
  paddingX: { sm: 12, md: 16, lg: 20 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabled: { opacity: 0.6 },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: theme.paddingY.sm, paddingHorizontal: theme.paddingX.sm },
  md: { paddingVertical: theme.paddingY.md, paddingHorizontal: theme.paddingX.md },
  lg: { paddingVertical: theme.paddingY.lg, paddingHorizontal: theme.paddingX.lg },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.secondary },
  danger: { backgroundColor: theme.colors.danger },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#fff' },
});

const variantText = StyleSheet.create({
  primary: { color: theme.colors.textDark },
  secondary: { color: theme.colors.textLight },
  danger: { color: theme.colors.textLight },
  ghost: { color: theme.colors.textLight },
});
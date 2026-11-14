import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BrandColors } from '@/constants/theme';

type FoodButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  hint?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  trailing?: string;
  style?: StyleProp<ViewStyle>;
};

export function FoodButton({
  label,
  hint,
  variant = 'primary',
  trailing,
  disabled,
  style,
  ...props
}: FoodButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      {...props}>
      <View style={styles.copy}>
        <Text style={[styles.label, variant === 'primary' ? styles.lightText : styles.darkText]}>
          {label}
        </Text>
        {hint ? (
          <Text
            style={[
              styles.hint,
              variant === 'primary' ? styles.lightHint : styles.darkHint,
            ]}>
            {hint}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text
          aria-hidden
          style={[styles.trailing, variant === 'primary' ? styles.lightText : styles.darkText]}>
          {trailing}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primary: {
    backgroundColor: BrandColors.primary,
  },
  secondary: {
    backgroundColor: BrandColors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
  },
  lightText: {
    color: BrandColors.white,
  },
  darkText: {
    color: BrandColors.primary,
  },
  lightHint: {
    color: '#DCEBDD',
  },
  darkHint: {
    color: '#52705D',
  },
  trailing: {
    fontSize: 20,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});

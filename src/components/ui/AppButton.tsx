import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { Pressable, Text } from "@/components/LocalizedText";

export type AppButtonVariant =
  | "primary"
  | "fitness"
  | "secondary"
  | "ghost"
  | "danger";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  className?: string;
}

const containerClasses: Record<AppButtonVariant, string> = {
  primary: "bg-brand-primary",
  fitness: "bg-fitness-primary",
  secondary:
    "border border-brand-border bg-surface-light dark:border-selected-dark dark:bg-surface-dark",
  ghost: "bg-transparent",
  danger: "bg-danger-light",
};

const labelClasses: Record<AppButtonVariant, string> = {
  primary: "text-white",
  fitness: "text-white",
  secondary: "text-ink-light dark:text-ink-dark",
  ghost: "text-brand-primary dark:text-[#8CC0A0]",
  danger: "text-white",
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  icon,
  rightIcon,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  className = "",
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center justify-center gap-2.5 rounded-[18px] px-5 active:opacity-80 disabled:opacity-50 ${containerClasses[variant]} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" || variant === "ghost" ? "#245C45" : "#FFFFFF"}
          size="small"
        />
      ) : (
        icon
      )}
      <Text className={`text-[15px] font-bold ${labelClasses[variant]}`}>
        {label}
      </Text>
      {!loading && rightIcon ? <View>{rightIcon}</View> : null}
    </Pressable>
  );
}

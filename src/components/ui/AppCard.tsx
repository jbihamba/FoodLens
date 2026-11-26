import type { PropsWithChildren } from "react";
import { View } from "react-native";

export type AppCardVariant =
  | "default"
  | "elevated"
  | "outlined"
  | "dashed"
  | "fitness";

interface AppCardProps extends PropsWithChildren {
  variant?: AppCardVariant;
  className?: string;
}

const variantClasses: Record<AppCardVariant, string> = {
  default:
    "rounded-[22px] border border-brand-border bg-surface-light p-4 dark:border-selected-dark dark:bg-surface-dark",
  elevated:
    "rounded-[24px] border border-selected-light bg-surface-light p-5 shadow-sm dark:border-selected-dark dark:bg-surface-dark",
  outlined:
    "rounded-[20px] border border-brand-border bg-canvas-light p-4 dark:border-selected-dark dark:bg-canvas-dark",
  dashed:
    "rounded-[22px] border border-dashed border-brand-border bg-surface-light p-5 dark:border-selected-dark dark:bg-surface-dark",
  fitness:
    "rounded-[22px] border border-[#F5D6BE] bg-fitness-softLight p-4 dark:border-[#523824] dark:bg-fitness-softDark",
};

export function AppCard({
  variant = "default",
  className = "",
  children,
}: AppCardProps) {
  return (
    <View className={`${variantClasses[variant]} ${className}`}>
      {children}
    </View>
  );
}

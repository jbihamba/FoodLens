import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "@/components/LocalizedText";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "fitness" | "secondary";
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "primary",
}: EmptyStateProps) {
  return (
    <AppCard variant="dashed" className="items-center px-6 py-7">
      {icon ? (
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-secondary dark:bg-selected-dark">
          {icon}
        </View>
      ) : null}
      <Text className="text-center text-[16px] font-bold text-ink-light dark:text-ink-dark">
        {title}
      </Text>
      <Text className="mt-1.5 max-w-[280px] text-center text-[13px] leading-5 text-muted-light dark:text-muted-dark">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <View className="mt-4 w-full max-w-[240px]">
          <AppButton
            label={actionLabel}
            variant={actionVariant}
            onPress={onAction}
          />
        </View>
      ) : null}
    </AppCard>
  );
}

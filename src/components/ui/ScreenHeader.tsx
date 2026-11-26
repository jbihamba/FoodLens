import { router } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";

import { Pressable, Text } from "@/components/LocalizedText";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import { theme } from "@/constants/theme";
import { useAppSettings } from "@/stores/app-settings";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  showBack = false,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  const { resolvedColorScheme } = useAppSettings();
  const accentColor =
    resolvedColorScheme === "dark"
      ? theme.colors.accentDark
      : theme.colors.accent;

  return (
    <View className="pt-2">
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack ?? (() => router.back())}
          className="-ml-2 mb-1 min-h-11 flex-row items-center self-start px-2"
        >
          <ChevronLeftIcon size={20} color={accentColor} />
          <Text className="ml-1 text-[14px] font-bold text-brand-primary dark:text-[#8CC0A0]">
            Retour
          </Text>
        </Pressable>
      ) : null}

      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          {eyebrow ? (
            <Text className="text-[11px] font-bold uppercase tracking-[1px] text-muted-light dark:text-muted-dark">
              {eyebrow}
            </Text>
          ) : null}
          <Text className="text-[28px] font-extrabold leading-[34px] tracking-[-0.5px] text-ink-light dark:text-ink-dark">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[14px] leading-5 text-muted-light dark:text-muted-dark">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAction ? <View>{rightAction}</View> : null}
      </View>
    </View>
  );
}

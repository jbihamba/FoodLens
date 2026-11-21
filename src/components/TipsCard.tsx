import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { View } from 'react-native';

import { Pressable, Text } from '@/components/LocalizedText';
import { theme } from '@/constants/theme';
import { translateTip } from '@/i18n/tips';
import type { Tip, TipAction } from '@/services/tips/types';
import { useAppSettings } from '@/stores/app-settings';

interface TipsCardProps {
  tip: Tip;
  onDismiss?: (ruleId: string) => void;
}

const severityStyles = {
  attention: {
    icon: '◉',
    surfaceLight: theme.colors.tipAttentionLight,
    surfaceDark: theme.colors.tipAttentionDark,
    iconLight: theme.colors.tipAttentionIconLight,
    iconDark: theme.colors.tipAttentionIconDark,
  },
  info: {
    icon: '✦',
    surfaceLight: theme.colors.tipInfoLight,
    surfaceDark: theme.colors.tipInfoDark,
    iconLight: theme.colors.tipInfoIconLight,
    iconDark: theme.colors.tipInfoIconDark,
  },
  positive: {
    icon: '✓',
    surfaceLight: theme.colors.tipPositiveLight,
    surfaceDark: theme.colors.tipPositiveDark,
    iconLight: theme.colors.tipPositiveIconLight,
    iconDark: theme.colors.tipPositiveIconDark,
  },
} as const;

function openAction(action: TipAction) {
  router.push(action.target === 'entry' ? '/entry' : '/calendar');
}

export function TipsCard({ tip, onDismiss }: TipsCardProps) {
  const { settings, resolvedColorScheme } = useAppSettings();
  const appearance = severityStyles[tip.severity];
  const action = tip.action;
  const isDark = resolvedColorScheme === 'dark';

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      className="rounded-[20px] border p-4"
      style={{
        backgroundColor: isDark ? appearance.surfaceDark : appearance.surfaceLight,
        borderColor: isDark ? theme.colors.borderDark : theme.colors.borderLight,
      }}>
      <View className="flex-row items-start">
        <View
          className="mr-3 mt-0.5 h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: isDark ? theme.colors.tipMetricDark : theme.colors.tipMetricLight }}>
          <Text
            accessibilityLabel={translateTip(tip.titleKey, settings.language)}
            style={{ color: isDark ? appearance.iconDark : appearance.iconLight }}
            className="text-[18px] font-bold">
            {appearance.icon}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold leading-5 text-ink-light dark:text-ink-dark">
            {translateTip(tip.titleKey, settings.language)}
          </Text>
          <Text className="mt-1.5 text-[12px] leading-[18px] text-muted-light dark:text-muted-dark">
            {translateTip(tip.messageKey, settings.language, tip.params)}
          </Text>
        </View>
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translateTip('tips.ui.dismiss', settings.language)}
            onPress={() => onDismiss(tip.ruleId)}
            className="ml-1 min-h-11 min-w-11 items-center justify-center rounded-full">
            <Text className="text-[20px] text-muted-light dark:text-muted-dark">×</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View
          className="rounded-full px-3 py-1.5"
          style={{ backgroundColor: isDark ? theme.colors.tipMetricDark : theme.colors.tipMetricLight }}>
          <Text className="text-[12px] font-bold text-ink-light dark:text-ink-dark">
            {tip.highlightValue}
          </Text>
          <Text className="text-[10px] font-medium text-muted-light dark:text-muted-dark">
            {translateTip(tip.highlightLabelKey, settings.language)}
          </Text>
        </View>
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translateTip(action.labelKey, settings.language)}
            onPress={() => openAction(action)}
            className="min-h-11 max-w-[55%] items-end justify-center pl-3">
            <Text className="text-right text-[12px] font-bold text-brand-primary dark:text-[#A8C8B2]">
              {translateTip(action.labelKey, settings.language)}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function TipsEmptyState({ message }: { message: string }) {
  return (
    <View className="items-center rounded-[20px] border border-dashed border-selected-light bg-surface-light px-5 py-5 dark:border-selected-dark dark:bg-surface-dark">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-secondary dark:bg-selected-dark">
        <Text className="text-[18px] font-bold text-brand-primary dark:text-[#A8C8B2]">✦</Text>
      </View>
      <Text className="mt-3 text-center text-[12px] leading-[18px] text-muted-light dark:text-muted-dark">
        {message}
      </Text>
    </View>
  );
}

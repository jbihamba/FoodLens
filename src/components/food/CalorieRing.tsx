import Svg, { Circle } from 'react-native-svg';
import { View } from 'react-native';

import { Text } from '@/components/LocalizedText';
import { theme } from '@/constants/theme';
import { useAppSettings } from '@/stores/app-settings';

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ consumed, goal, size = 190 }: CalorieRingProps) {
  const { resolvedColorScheme } = useAppSettings();
  const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 0;
  const safeConsumed = Number.isFinite(consumed) ? Math.max(consumed, 0) : 0;
  const progress = safeGoal > 0 ? Math.min(safeConsumed / safeGoal, 1) : 0;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const remaining = Math.max(safeGoal - safeConsumed, 0);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Progression des calories du jour"
      accessibilityValue={{ min: 0, max: safeGoal, now: Math.min(safeConsumed, safeGoal) }}
      className="items-center justify-center"
      style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedColorScheme === 'dark' ? theme.colors.trackDark : theme.colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={
            resolvedColorScheme === 'dark' ? theme.colors.accentDark : theme.colors.accent
          }
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text className="text-[30px] font-extrabold tracking-[-1px] text-ink-light dark:text-ink-dark">
        {safeConsumed.toLocaleString('fr-FR')}
      </Text>
      <Text className="text-[12px] font-semibold text-muted-light dark:text-muted-dark">
        kcal consommées
      </Text>
      <Text className="mt-1 text-[13px] font-bold text-brand-primary dark:text-[#A8C8B2]">
        {remaining.toLocaleString('fr-FR')} kcal restantes
      </Text>
    </View>
  );
}

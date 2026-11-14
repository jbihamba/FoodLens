import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CalorieProgressBar } from '@/components/food/CalorieProgressBar';
import type { FoodEntry } from '@/services/calorieTracking';

interface DailyCalorieCardProps {
  goal: number;
  consumed: number;
  isLoading: boolean;
  entries: FoodEntry[];
}

export function DailyCalorieCard({
  goal,
  consumed,
  isLoading,
  entries,
}: DailyCalorieCardProps) {
  const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 0;
  const percentage = safeGoal > 0 ? (consumed / safeGoal) * 100 : 0;
  const remaining = Math.max(safeGoal - consumed, 0);

  return (
    <View className="mt-[25px] rounded-[23px] border-[0.5px] border-selected-light bg-surface-light p-[19px] dark:border-selected-dark dark:bg-surface-dark">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] font-bold tracking-[1.2px] text-muted-light dark:text-muted-dark">
            DAILY GOAL
          </Text>
          <Text className="mt-[5px] text-[24px] font-bold tracking-[-0.7px] text-ink-light dark:text-ink-dark">
            {safeGoal.toLocaleString()} kcal
          </Text>
        </View>
        <Link href="/goal" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit daily calorie goal"
            className="rounded-[13px] bg-brand-secondary px-[13px] py-[9px]">
            <Text className="text-xs font-bold text-brand-primary">Edit</Text>
          </Pressable>
        </Link>
      </View>

      {isLoading ? (
        <View className="mt-5 min-h-12 flex-row items-center justify-center">
          <ActivityIndicator color="#245C45" />
          <Text className="ml-2 text-xs text-muted-light dark:text-muted-dark">
            Loading today&apos;s calories…
          </Text>
        </View>
      ) : (
        <>
          <View className="mt-[19px] flex-row items-baseline justify-between">
            <Text className="text-[18px] font-bold text-ink-light dark:text-ink-dark">
              {consumed.toLocaleString()} / {safeGoal.toLocaleString()} kcal
            </Text>
            <Text className="text-xs font-bold text-brand-primary dark:text-[#A8C8B2]">
              {percentage.toLocaleString(undefined, { maximumFractionDigits: 1 })}%
            </Text>
          </View>
          <View className="mt-[11px]">
            <CalorieProgressBar progress={percentage} />
          </View>
          <Text className="mt-[12px] text-xs font-medium text-muted-light dark:text-muted-dark">
            {consumed > safeGoal
              ? `${(consumed - safeGoal).toLocaleString()} kcal over your goal`
              : `${remaining.toLocaleString()} kcal remaining`}
          </Text>
          {entries.length === 0 && (
            <Text className="mt-2 text-[11px] leading-4 text-muted-light dark:text-muted-dark">
              Log a scanned meal to start tracking today.
            </Text>
          )}
        </>
      )}
    </View>
  );
}

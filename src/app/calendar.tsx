import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { Pressable, Text } from '@/components/LocalizedText';
import {
  DEFAULT_DAILY_GOAL,
  getFoodEntriesForLocalDay,
  getFoodEntriesForLocalMonth,
  type FoodEntry,
} from '@/services/calorieTracking';
import { useDailyCalories } from '@/stores/daily-calories';
import { useAppSettings } from '@/stores/app-settings';

const MEAL_GROUPS = [
  { key: 'Breakfast', title: 'Breakfast', icon: '☀' },
  { key: 'Lunch', title: 'Lunch', icon: '◉' },
  { key: 'Dinner', title: 'Dinner', icon: '◒' },
  { key: 'Snack', title: 'Snacks', icon: '✳' },
] as const;

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(consumedAt: string, locale: string) {
  const date = new Date(consumedAt);
  return Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function getMealGroup(mealType: string | null) {
  return MEAL_GROUPS.find((group) => group.key === mealType)?.key ?? 'Other';
}

function formatPercentage(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}

export default function CalendarScreen() {
  const db = useSQLiteContext();
  const { settings } = useAppSettings();
  const { goal } = useDailyCalories();
  const locale = settings.language === 'fr' ? 'fr-FR' : 'en-US';
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Date(2024, 0, index + 1).toLocaleDateString(locale, { weekday: 'short' }),
      ),
    [locale],
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [monthEntries, setMonthEntries] = useState<FoodEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDateKey = getLocalDateKey(selectedDate);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      setIsLoading(true);
      setError(null);
      Promise.all([
        getFoodEntriesForLocalMonth(db, viewMonth),
        getFoodEntriesForLocalDay(db, selectedDate),
      ])
        .then(([entriesForMonth, entriesForDay]) => {
          if (isCurrent) {
            setMonthEntries(entriesForMonth);
            setSelectedEntries(entriesForDay);
          }
        })
        .catch((cause: unknown) => {
          if (isCurrent) {
            setError(cause instanceof Error ? cause.message : 'Could not load your food history.');
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsLoading(false);
          }
        });

      return () => {
        isCurrent = false;
      };
    }, [db, selectedDate, viewMonth]),
  );

  const entriesByDate = useMemo(() => {
    const dates = new Set<string>();
    for (const entry of monthEntries) {
      dates.add(getLocalDateKey(new Date(entry.consumed_at)));
    }
    return dates;
  }, [monthEntries]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const leadingDays = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + 1,
      0,
    ).getDate();
    const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

    return Array.from({ length: cellCount }, (_, index) => {
      const day = index - leadingDays + 1;
      return day > 0 && day <= daysInMonth
        ? new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
        : null;
    });
  }, [viewMonth]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, FoodEntry[]>();
    for (const group of MEAL_GROUPS) {
      groups.set(group.key, []);
    }
    for (const entry of selectedEntries) {
      const key = getMealGroup(entry.meal_type);
      const meals = groups.get(key) ?? [];
      meals.push(entry);
      groups.set(key, meals);
    }
    return groups;
  }, [selectedEntries]);

  const otherEntries = groupedEntries.get('Other') ?? [];
  const displayedGroups = otherEntries.length
    ? [...MEAL_GROUPS, { key: 'Other', title: 'Other meals', icon: '⋯' }]
    : MEAL_GROUPS;
  const totalCalories = selectedEntries.reduce((total, entry) => total + entry.calories, 0);
  const dailyGoal = goal?.target_calories ?? DEFAULT_DAILY_GOAL;
  const completion = dailyGoal > 0 ? (totalCalories / dailyGoal) * 100 : 0;
  const todayKey = getLocalDateKey(new Date());
  const selectedLabel = selectedDate.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const changeMonth = (amount: number) => {
    const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + amount, 1);
    const lastDayOfNextMonth = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0,
    ).getDate();
    const nextDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      Math.min(selectedDate.getDate(), lastDayOfNextMonth),
    );
    setViewMonth(nextMonth);
    setSelectedDate(nextDate);
  };

  const selectToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView
        contentContainerClassName="mx-auto w-full max-w-[560px] self-center px-5 pb-8"
        showsVerticalScrollIndicator={false}>
        <View className="min-h-[64px] flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            className="h-11 w-11 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
            <Text className="text-[22px] text-ink-light dark:text-ink-dark">‹</Text>
          </Pressable>
          <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
            Food calendar
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to today"
            onPress={selectToday}
            className="min-h-10 items-center justify-center rounded-full bg-brand-secondary px-4 dark:bg-selected-dark">
            <Text className="text-xs font-bold text-brand-primary dark:text-[#A8C8B2]">Today</Text>
          </Pressable>
        </View>

        <View className="mt-4 rounded-[24px] border-[0.5px] border-selected-light bg-surface-light p-4 dark:border-selected-dark dark:bg-surface-dark">
          <View className="mb-5 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => changeMonth(-1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-canvas-light dark:bg-canvas-dark">
              <Text className="text-[22px] text-ink-light dark:text-ink-dark">‹</Text>
            </Pressable>
            <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
              {viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => changeMonth(1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-canvas-light dark:bg-canvas-dark">
              <Text className="text-[22px] text-ink-light dark:text-ink-dark">›</Text>
            </Pressable>
          </View>

          <View className="mb-2 flex-row">
            {weekdays.map((weekday) => (
              <View key={weekday} className="h-8 flex-1 items-center justify-center">
                <Text className="text-[10px] font-semibold text-muted-light dark:text-muted-dark">
                  {weekday}
                </Text>
              </View>
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} className="h-[50px] w-[14.2857%]" />;
              }
              const dateKey = getLocalDateKey(date);
              const isSelected = dateKey === selectedDateKey;
              const isToday = dateKey === todayKey;
              const hasMeals = entriesByDate.has(dateKey);
              return (
                <Pressable
                  key={dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={`${date.toLocaleDateString(locale, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}${hasMeals ? ', meals recorded' : ''}${isToday ? ', today' : ''}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedDate(date)}
                  className="h-[50px] w-[14.2857%] items-center justify-center">
                  <View
                    className={`h-[37px] w-[37px] items-center justify-center rounded-full ${
                      isSelected
                        ? 'bg-brand-primary'
                        : isToday
                          ? 'border border-brand-primary bg-brand-secondary dark:bg-selected-dark'
                          : ''
                    }`}>
                    <Text
                      className={`text-[13px] font-semibold ${
                        isSelected
                          ? 'text-white'
                          : 'text-ink-light dark:text-ink-dark'
                      }`}>
                      {date.getDate()}
                    </Text>
                  </View>
                  <View
                    className={`absolute bottom-[3px] h-[5px] w-[5px] rounded-full ${
                      hasMeals
                        ? isSelected
                          ? 'bg-white'
                          : 'bg-[#4E9B67]'
                        : 'bg-transparent'
                    }`}
                  />
                </Pressable>
              );
            })}
          </View>
          <View className="mt-3 flex-row items-center justify-center gap-2">
            <View className="h-[6px] w-[6px] rounded-full bg-[#4E9B67]" />
            <Text className="text-[10px] text-muted-light dark:text-muted-dark">
              Meals recorded
            </Text>
            <View className="ml-3 h-3 w-3 rounded-full border border-brand-primary bg-brand-secondary dark:bg-selected-dark" />
            <Text className="text-[10px] text-muted-light dark:text-muted-dark">Today</Text>
          </View>
        </View>

        <View className="mt-5 rounded-[23px] border-[0.5px] border-selected-light bg-surface-light p-[18px] dark:border-selected-dark dark:bg-surface-dark">
          <Text className="text-[10px] font-bold tracking-[1px] text-muted-light dark:text-muted-dark">
            DAILY SUMMARY
          </Text>
          <Text className="mt-1 text-[16px] font-bold text-ink-light dark:text-ink-dark">
            {selectedLabel}
          </Text>
          {isLoading ? (
            <View className="min-h-[92px] flex-row items-center justify-center">
              <ActivityIndicator color="#245C45" />
              <Text className="ml-2 text-xs text-muted-light dark:text-muted-dark">
                Loading food history…
              </Text>
            </View>
          ) : (
            <>
              <View className="mt-5 flex-row items-end justify-between">
                <View>
                  <Text className="text-[28px] font-bold tracking-[-0.8px] text-ink-light dark:text-ink-dark">
                    {totalCalories.toLocaleString()}
                    <Text className="text-[13px] font-semibold text-muted-light dark:text-muted-dark">
                      {' '}kcal
                    </Text>
                  </Text>
                  <Text className="mt-1 text-[11px] text-muted-light dark:text-muted-dark">
                    of {dailyGoal.toLocaleString()} kcal goal
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[20px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                    {formatPercentage(completion)}
                  </Text>
                  <Text className="mt-1 text-[11px] text-muted-light dark:text-muted-dark">
                    {selectedEntries.length} {selectedEntries.length === 1 ? 'meal' : 'meals'}
                  </Text>
                </View>
              </View>
              <View className="mt-4 h-[7px] overflow-hidden rounded-full bg-canvas-light dark:bg-canvas-dark">
                <View
                  className="h-full rounded-full bg-brand-primary"
                  style={{ width: `${Math.min(completion, 100)}%` }}
                />
              </View>
            </>
          )}
        </View>

        {error ? (
          <Text accessibilityRole="alert" className="mt-3 text-xs leading-5 text-[#A53F35]">
            {error}
          </Text>
        ) : null}

        <View className="mt-6">
          <View className="mb-3 flex-row items-end justify-between">
            <View>
              <Text className="text-[20px] font-bold tracking-[-0.4px] text-ink-light dark:text-ink-dark">
                Meal history
              </Text>
              <Text className="mt-1 text-[11px] text-muted-light dark:text-muted-dark">
                {selectedDate.toLocaleDateString(locale, { month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <Text className="text-[10px] font-bold tracking-[0.7px] text-brand-primary dark:text-[#A8C8B2]">
              {selectedEntries.length} {selectedEntries.length === 1 ? 'MEAL' : 'MEALS'}
            </Text>
          </View>

          {isLoading ? (
            <View className="min-h-20 items-center justify-center rounded-[20px] bg-surface-light dark:bg-surface-dark">
              <ActivityIndicator color="#245C45" />
            </View>
          ) : selectedEntries.length === 0 ? (
            <View className="rounded-[20px] border-[0.5px] border-selected-light bg-surface-light px-4 py-6 dark:border-selected-dark dark:bg-surface-dark">
              <Text className="text-center text-[13px] font-semibold text-ink-light dark:text-ink-dark">
                No meals recorded
              </Text>
              <Text className="mt-1 text-center text-[11px] text-muted-light dark:text-muted-dark">
                Your food history for this day will appear here.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {displayedGroups.map((group) => {
                const meals = groupedEntries.get(group.key) ?? [];
                if (!meals.length) {
                  return null;
                }
                return (
                  <View
                    key={group.key}
                    className="overflow-hidden rounded-[20px] border-[0.5px] border-selected-light bg-surface-light dark:border-selected-dark dark:bg-surface-dark">
                    <View className="flex-row items-center gap-2 border-b border-brand-border px-4 py-3 dark:border-selected-dark">
                      <Text className="text-[14px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                        {group.icon}
                      </Text>
                      <Text className="flex-1 text-[13px] font-bold text-ink-light dark:text-ink-dark">
                        {group.title}
                      </Text>
                      <Text className="text-[10px] text-muted-light dark:text-muted-dark">
                        {meals.reduce((sum, entry) => sum + entry.calories, 0).toLocaleString()} kcal
                      </Text>
                    </View>
                    {meals.map((entry) => (
                      <View
                        key={entry.id}
                        className="min-h-[58px] flex-row items-center gap-3 border-b border-brand-border px-4 py-3 last:border-b-0 dark:border-selected-dark">
                        <View className="h-2 w-2 rounded-full bg-brand-secondary dark:bg-selected-dark" />
                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-[13px] font-semibold text-ink-light dark:text-ink-dark">
                            {entry.food_name}
                          </Text>
                          <Text className="mt-1 text-[10px] text-muted-light dark:text-muted-dark">
                            {formatTime(entry.consumed_at, locale)}
                          </Text>
                        </View>
                        <Text className="text-[11px] font-bold text-ink-light dark:text-ink-dark">
                          {entry.calories.toLocaleString()} kcal
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

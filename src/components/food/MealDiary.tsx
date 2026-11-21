import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Pressable, Text } from "@/components/LocalizedText";
import { useAppSettings } from "@/stores/app-settings";
import { StyledImage } from "@/components/nativewind-interop";
import type { FoodEntry } from "@/services/calorieTracking";

const MEAL_GROUPS = [
  { key: "Breakfast", title: "Breakfast", icon: "☀" },
  { key: "Lunch", title: "Lunch", icon: "◉" },
  { key: "Dinner", title: "Dinner", icon: "◒" },
  { key: "Snack", title: "Snacks", icon: "✳" },
] as const;

interface MealDiaryProps {
  entries: FoodEntry[];
  onEdit: (id: number) => void;
  onDelete: (entry: FoodEntry) => void;
}

function formatTime(consumedAt: string, locale: string) {
  const date = new Date(consumedAt);
  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MealDiary({ entries, onEdit, onDelete }: MealDiaryProps) {
  const { settings } = useAppSettings();
  const locale = settings.language === "fr" ? "fr-FR" : "en-US";
  const groupEntries = new Map<string, FoodEntry[]>();
  for (const group of MEAL_GROUPS) {
    groupEntries.set(group.key, []);
  }

  for (const entry of entries) {
    const category =
      MEAL_GROUPS.find((group) => group.key === entry.meal_type)?.key ??
      "Other";
    const grouped = groupEntries.get(category) ?? [];
    grouped.push(entry);
    groupEntries.set(category, grouped);
  }

  const hasOtherMeals = groupEntries.has("Other");
  const groups = hasOtherMeals
    ? [...MEAL_GROUPS, { key: "Other", title: "Other meals", icon: "⋯" }]
    : MEAL_GROUPS;

  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-end justify-between">
        <View>
          <Text className="text-[20px] font-bold tracking-[-0.4px] text-ink-light dark:text-ink-dark">
            Today&apos;s diary
          </Text>
          <Text className="mt-1 text-[11px] text-muted-light dark:text-muted-dark">
            Meals grouped by category
          </Text>
        </View>
        <Text className="text-[10px] font-bold tracking-[0.8px] text-brand-primary dark:text-[#A8C8B2]">
          {entries.length} {entries.length === 1 ? "MEAL" : "MEALS"}
        </Text>
      </View>

      <View className="gap-3">
        {groups.map((group, index) => {
          const meals = groupEntries.get(group.key) ?? [];
          const categoryCalories = meals.reduce(
            (total, entry) => total + entry.calories,
            0,
          );

          return (
            <Animated.View
              entering={FadeIn.delay(index * 45).duration(220)}
              key={group.key}
              className="overflow-hidden rounded-[21px] border-[0.5px] border-selected-light bg-surface-light dark:border-selected-dark dark:bg-surface-dark"
            >
              <View className="flex-row items-center justify-between px-[15px] pb-3 pt-[14px]">
                <View className="flex-row items-center gap-[10px]">
                  <View className="h-[35px] w-[35px] items-center justify-center rounded-[12px] bg-brand-secondary dark:bg-selected-dark">
                    <Text className="text-base font-bold text-brand-primary dark:text-[#A8C8B2]">
                      {group.icon}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[14px] font-bold text-ink-light dark:text-ink-dark">
                      {group.title}
                    </Text>
                    <Text className="mt-[2px] text-[10px] text-muted-light dark:text-muted-dark">
                      {meals.length === 1 ? "1 meal" : `${meals.length} meals`}
                    </Text>
                  </View>
                </View>
                <Text className="text-[13px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                  {categoryCalories.toLocaleString()} kcal
                </Text>
              </View>

              {meals.length > 0 ? (
                <View className="gap-[9px] px-[11px] pb-[11px]">
                  {meals.map((entry) => (
                    <View
                      key={entry.id}
                      className="min-h-[74px] flex-row items-center gap-[10px] rounded-[16px] bg-canvas-light p-[9px] dark:bg-canvas-dark"
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${entry.food_name}`}
                        onPress={() => onEdit(entry.id)}
                        className="min-h-[54px] flex-1 flex-row items-center gap-[10px]"
                      >
                        <View className="h-[54px] w-[54px] overflow-hidden rounded-[14px] bg-brand-secondary dark:bg-selected-dark">
                          {entry.image_uri ? (
                            <StyledImage
                              source={{ uri: entry.image_uri }}
                              contentFit="cover"
                              className="h-full w-full"
                            />
                          ) : (
                            <View className="flex-1 items-center justify-center">
                              <Text className="text-xl text-brand-primary dark:text-[#A8C8B2]">
                                {group.icon}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-[13px] font-bold text-ink-light dark:text-ink-dark"
                          >
                            {entry.food_name}
                          </Text>
                          <Text className="mt-1 text-[10px] text-muted-light dark:text-muted-dark">
                            {formatTime(entry.consumed_at, locale)}
                          </Text>
                        </View>
                      </Pressable>
                      <Text className="text-[11px] font-bold text-ink-light dark:text-ink-dark">
                        {entry.calories.toLocaleString()} kcal
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${entry.food_name}`}
                        onPress={() => onDelete(entry)}
                        className="h-10 w-9 items-center justify-center rounded-full"
                      >
                        <Text className="text-[20px] text-muted-light dark:text-muted-dark">
                          ×
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="mx-[11px] mb-[11px] rounded-[15px] bg-canvas-light px-3 py-[13px] dark:bg-canvas-dark">
                  <Text className="text-[11px] text-muted-light dark:text-muted-dark">
                    No meals logged for {group.title.toLowerCase()} yet.
                  </Text>
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

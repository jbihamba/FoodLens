import { View } from "react-native";

import { Pressable, Text } from "@/components/LocalizedText";
import { StyledImage } from "@/components/nativewind-interop";
import type { FoodEntry } from "@/services/calorieTracking";

interface MealCardProps {
  entry: FoodEntry;
  onPress?: () => void;
  onDelete?: () => void;
}

export function MealCard({ entry, onPress, onDelete }: MealCardProps) {
  const consumedAt = new Date(entry.consumed_at);
  const timeLabel = Number.isNaN(consumedAt.getTime())
    ? "Heure indisponible"
    : consumedAt.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
  const details = (
    <>
      <View className="h-[52px] w-[52px] overflow-hidden rounded-[14px] bg-brand-secondary dark:bg-selected-dark">
        {entry.image_uri ? (
          <StyledImage
            source={{ uri: entry.image_uri }}
            contentFit="cover"
            className="h-full w-full"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-xl" accessibilityLabel="Repas">
              🍽
            </Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-[15px] font-bold text-ink-light dark:text-ink-dark"
        >
          {entry.food_name}
        </Text>
        <Text className="mt-1 text-[12px] text-muted-light dark:text-muted-dark">
          {timeLabel}
        </Text>
      </View>
    </>
  );

  return (
    <View className="min-h-[76px] flex-row items-center gap-2 rounded-[18px] border border-selected-light bg-surface-light p-3 dark:border-selected-dark dark:bg-surface-dark">
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Modifier ${entry.food_name}`}
          onPress={onPress}
          className="min-h-11 flex-1 flex-row items-center gap-3"
        >
          {details}
        </Pressable>
      ) : (
        <View className="min-h-11 flex-1 flex-row items-center gap-3">
          {details}
        </View>
      )}
      <Text className="text-[13px] font-bold text-ink-light dark:text-ink-dark">
        {Math.round(entry.calories).toLocaleString("fr-FR")} kcal
      </Text>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Supprimer ${entry.food_name}`}
          onPress={onDelete}
          className="min-h-11 min-w-11 items-center justify-center rounded-full"
        >
          <Text className="text-xl text-muted-light dark:text-muted-dark">
            ×
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

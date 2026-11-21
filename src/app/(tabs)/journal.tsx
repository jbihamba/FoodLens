import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MealCard } from "@/components/food/MealCard";
import { ScanButton } from "@/components/food/ScanButton";
import { Pressable, Text } from "@/components/LocalizedText";
import { useDailyCalories } from "@/stores/daily-calories";

export default function JournalScreen() {
  const { entries, refresh } = useDailyCalories();
  useFocusEffect(
    useCallback(() => {
      void refresh().catch(() => undefined);
    }, [refresh]),
  );

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-canvas-light dark:bg-canvas-dark"
    >
      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[28px] font-extrabold text-ink-light dark:text-ink-dark">
          Journal
        </Text>
        <View className="mt-4">
          <ScanButton onPress={() => router.push("/scanner")} />
        </View>
        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
            Aujourd’hui · {entries.length} repas
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le calendrier"
            onPress={() => router.push("/calendar")}
            className="min-h-11 items-center justify-center px-2"
          >
            <Text className="text-[12px] font-bold text-brand-primary dark:text-[#A8C8B2]">
              Calendrier
            </Text>
          </Pressable>
        </View>
        {entries.length ? (
          <View className="mt-3 gap-2">
            {entries.map((entry) => (
              <MealCard
                key={entry.id}
                entry={entry}
                onPress={() =>
                  router.push({
                    pathname: "/entry",
                    params: { id: String(entry.id) },
                  })
                }
              />
            ))}
          </View>
        ) : (
          <View className="mt-3 items-center rounded-[22px] bg-surface-light p-6 dark:bg-surface-dark">
            <Text className="text-center text-[14px] font-semibold text-muted-light dark:text-muted-dark">
              Aucun repas pour le moment. Scanne ton premier plat pour le
              retrouver ici.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

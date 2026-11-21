import { router } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/food/BrandMark";
import { Pressable, Text } from "@/components/LocalizedText";
import { useCalorieGoal } from "@/hooks/useCalorieGoal";
import { useAppSettings } from "@/stores/app-settings";

export default function ProfileScreen() {
  const { settings } = useAppSettings();
  const { profile, result, isManualGoal, isLoading } = useCalorieGoal();

  const actions = [
    { label: "Réglages et préférences", path: "/settings" },
    { label: "Objectif calorique", path: "/goal" },
    { label: "Calendrier alimentaire", path: "/calendar" },
  ] as const;

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
          Profil
        </Text>
        <View className="mt-5 items-center rounded-[22px] bg-surface-light p-6 dark:bg-surface-dark">
          <BrandMark size={44} />
          <Text className="mt-3 text-[19px] font-bold text-ink-light dark:text-ink-dark">
            {settings.profile.displayName || "Mon profil"}
          </Text>
          <Text className="mt-1 text-[12px] text-muted-light dark:text-muted-dark">
            {settings.profile.profileInfo ||
              "FoodLens · données enregistrées sur cet appareil"}
          </Text>
        </View>

        {/* Section Mon profil et mon objectif */}
        <View className="mt-5 rounded-[22px] bg-surface-light dark:bg-surface-dark px-4 py-4">
          <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-muted-light dark:text-muted-dark mb-3">
            Mon profil et mon objectif
          </Text>
          {isLoading ? (
            <ActivityIndicator color="#245C45" />
          ) : profile && result ? (
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted-light dark:text-muted-dark">
                  Objectif calorique
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[15px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                    {result.target} kcal
                  </Text>
                  {isManualGoal && (
                    <View className="rounded-full bg-[#EDF5F0] dark:bg-[#1E3328] px-2 py-[2px]">
                      <Text className="text-[9px] font-bold text-[#245C45] dark:text-[#A8C8B2]">
                        PERSONNALISÉ
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted-light dark:text-muted-dark">
                  BMR
                </Text>
                <Text className="text-[13px] text-ink-light dark:text-ink-dark">
                  {Math.round(result.bmr)} kcal
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted-light dark:text-muted-dark">
                  TDEE
                </Text>
                <Text className="text-[13px] text-ink-light dark:text-ink-dark">
                  {Math.round(result.tdee)} kcal
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recalculer mon objectif calorique"
                onPress={() => router.push("/calorie-goal-wizard")}
                className="mt-2 min-h-10 items-center justify-center rounded-[12px] border border-brand-border dark:border-selected-dark"
              >
                <Text className="text-[13px] font-semibold text-brand-primary dark:text-[#A8C8B2]">
                  Recalculer mon objectif
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Calculer mon objectif calorique"
              onPress={() => router.push("/calorie-goal-wizard")}
              className="min-h-12 flex-row items-center justify-between"
            >
              <Text className="text-[14px] font-semibold text-ink-light dark:text-ink-dark">
                Calculer mon objectif calorique
              </Text>
              <Text className="text-[18px] text-brand-primary dark:text-[#A8C8B2]">
                ›
              </Text>
            </Pressable>
          )}
        </View>

        <View className="mt-4 gap-2">
          {actions.map((action) => (
            <Pressable
              key={action.path}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => router.push(action.path)}
              className="min-h-14 flex-row items-center justify-between rounded-[17px] bg-surface-light px-4 dark:bg-surface-dark"
            >
              <Text className="text-[14px] font-semibold text-ink-light dark:text-ink-dark">
                {action.label}
              </Text>
              <Text className="text-[18px] text-muted-light dark:text-muted-dark">
                ›
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalorieProgressBar } from "@/components/food/CalorieProgressBar";
import { Pressable, Text } from "@/components/LocalizedText";
import { TipsCard, TipsEmptyState } from "@/components/TipsCard";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FitnessIcon } from "@/components/ui/Icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { theme } from "@/constants/theme";
import { translateTip } from "@/i18n/tips";
import { DEFAULT_DAILY_GOAL } from "@/services/calorieTracking";
import { getWorkoutStats } from "@/services/workouts";
import { useAppSettings } from "@/stores/app-settings";
import { useDailyCalories } from "@/stores/daily-calories";
import { useTips } from "@/stores/tips";
import type { WorkoutStats } from "@/types/workout";

export default function ProgressionScreen() {
  const db = useSQLiteContext();
  const { goal, entries } = useDailyCalories();
  const {
    tips,
    stats: tipStats,
    isLoading: tipsLoading,
    error: tipsError,
    refreshTips,
    dismissTip,
  } = useTips();
  const { settings, resolvedColorScheme } = useAppSettings();
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);

  const isDark = resolvedColorScheme === "dark";
  const fitnessColor = isDark
    ? theme.colors.fitnessDark
    : theme.colors.fitness;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getWorkoutStats(db)
        .then((nextStats) => {
          if (active) setWorkoutStats(nextStats);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [db]),
  );

  const consumed = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const target = goal?.target_calories ?? DEFAULT_DAILY_GOAL;
  const totals = [
    { label: "Protéines", key: "protein_g" as const },
    { label: "Glucides", key: "carbs_g" as const },
    { label: "Lipides", key: "fat_g" as const },
  ];

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-canvas-light dark:bg-canvas-dark"
    >
      <ScrollView
        contentContainerClassName="mx-auto w-full max-w-[560px] px-5 pb-10 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Progression"
          subtitle="Vue d'ensemble nutrition & activité"
        />

        {/* Nutrition du jour */}
        <AppCard variant="elevated" className="mt-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-semibold text-muted-light dark:text-muted-dark">
              Calories aujourd&apos;hui
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/calendar")}
              className="min-h-8 justify-center"
            >
              <Text className="text-[12px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                Calendrier ›
              </Text>
            </Pressable>
          </View>
          <Text className="mt-1.5 text-[28px] font-extrabold text-ink-light dark:text-ink-dark">
            {Math.round(consumed).toLocaleString("fr-FR")}
            <Text className="text-[15px] font-semibold text-muted-light dark:text-muted-dark">
              {" "}
              / {target.toLocaleString("fr-FR")} kcal
            </Text>
          </Text>
          <View className="mt-3">
            <CalorieProgressBar
              progress={(consumed / target) * 100}
              isGoalReached={consumed >= target}
            />
          </View>

          <View className="mt-4 flex-row gap-2">
            {totals.map(({ label, key }) => {
              const available = entries.some((entry) => entry[key] !== null);
              const amount = entries.reduce(
                (sum, entry) => sum + (entry[key] ?? 0),
                0,
              );
              return (
                <View
                  key={key}
                  className="flex-1 items-center rounded-[14px] bg-canvas-light px-2 py-2.5 dark:bg-canvas-dark"
                >
                  <Text className="text-[15px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                    {available ? `${Math.round(amount)} g` : "—"}
                  </Text>
                  <Text className="mt-0.5 text-[11px] font-medium text-muted-light dark:text-muted-dark">
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </AppCard>

        {/* Activité sportive */}
        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
              Activité physique
            </Text>
            {workoutStats && workoutStats.totalSessions > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/workout-history")}
                className="min-h-9 justify-center px-1"
              >
                <Text className="text-[12px] font-bold text-fitness-primary dark:text-fitness-dark">
                  Historique ›
                </Text>
              </Pressable>
            ) : null}
          </View>

          {workoutStats && workoutStats.totalSessions > 0 ? (
            <View className="flex-row gap-2.5">
              <AppCard variant="default" className="flex-1 items-center py-4">
                <Text className="text-[22px] font-extrabold text-fitness-primary dark:text-fitness-dark">
                  {workoutStats.currentWeekSessions}
                </Text>
                <Text className="mt-1 text-center text-[11px] font-semibold text-muted-light dark:text-muted-dark">
                  Cette semaine
                </Text>
              </AppCard>
              <AppCard variant="default" className="flex-1 items-center py-4">
                <Text className="text-[22px] font-extrabold text-ink-light dark:text-ink-dark">
                  {Math.max(1, Math.round(workoutStats.totalTrainingSeconds / 60))}
                </Text>
                <Text className="mt-1 text-center text-[11px] font-semibold text-muted-light dark:text-muted-dark">
                  Min totales
                </Text>
              </AppCard>
              <AppCard variant="default" className="flex-1 items-center py-4">
                <Text className="text-[22px] font-extrabold text-brand-primary dark:text-[#8CC0A0]">
                  {workoutStats.consistencyDays}
                </Text>
                <Text className="mt-1 text-center text-[11px] font-semibold text-muted-light dark:text-muted-dark">
                  Jours actifs
                </Text>
              </AppCard>
            </View>
          ) : (
            <EmptyState
              icon={<FitnessIcon size={22} color={fitnessColor} />}
              title="Pas encore de séance enregistrée"
              description="Tes statistiques sportives apparaîtront ici dès que tu auras terminé un entraînement."
              actionLabel="Découvrir Fitness"
              actionVariant="fitness"
              onAction={() => router.push("/(tabs)/fitness")}
            />
          )}
        </View>

        {/* Conseils de la semaine */}
        <View className="mb-3 mt-7 flex-row items-center justify-between">
          <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
            {translateTip("tips.ui.week", settings.language)}
          </Text>
          {tipsLoading ? (
            <Text className="text-[11px] text-muted-light dark:text-muted-dark">
              {translateTip("tips.ui.loading", settings.language)}
            </Text>
          ) : null}
        </View>
        {tipsError ? (
          <View className="rounded-[18px] bg-[#FCEDEA] p-4 dark:bg-[#3A2421]">
            <Text
              accessibilityRole="alert"
              className="text-[12px] leading-[18px] text-[#8F322C] dark:text-[#F4B1A8]"
            >
              {translateTip("tips.ui.error", settings.language)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translateTip(
                "tips.ui.retry",
                settings.language,
              )}
              onPress={() => void refreshTips().catch(() => undefined)}
              className="mt-2 min-h-11 justify-center"
            >
              <Text className="text-[12px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                {translateTip("tips.ui.retry", settings.language)}
              </Text>
            </Pressable>
          </View>
        ) : tips.length ? (
          <View className="gap-3">
            {tips.map((tip) => (
              <TipsCard
                key={tip.id}
                tip={tip}
                onDismiss={(ruleId) =>
                  void dismissTip(ruleId).catch(() => undefined)
                }
              />
            ))}
          </View>
        ) : (
          <TipsEmptyState
            message={translateTip(
              tipStats && tipStats.current.trackedDays < 3
                ? "tips.ui.insufficient"
                : "tips.ui.empty",
              settings.language,
            )}
          />
        )}
        <Text className="mt-4 text-[11px] leading-[17px] text-muted-light dark:text-muted-dark">
          {translateTip("tips.ui.disclaimer", settings.language)}{" "}
          {translateTip("tips.ui.estimate", settings.language)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

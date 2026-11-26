import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/LocalizedText";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FitnessIcon } from "@/components/ui/Icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { theme } from "@/constants/theme";
import { localizePlan } from "@/constants/workoutLabels";
import { getWorkoutHistory, getWorkoutStats } from "@/services/workouts";
import { useAppSettings } from "@/stores/app-settings";
import type { WorkoutSession, WorkoutStats } from "@/types/workout";

export default function WorkoutHistoryScreen() {
  const db = useSQLiteContext();
  const { resolvedColorScheme } = useAppSettings();
  const [rows, setRows] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDark = resolvedColorScheme === "dark";
  const fitnessColor = isDark
    ? theme.colors.fitnessDark
    : theme.colors.fitness;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([getWorkoutHistory(db), getWorkoutStats(db)])
        .then(([history, nextStats]) => {
          if (!active) return;
          setRows(history);
          setStats(nextStats);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
      return () => {
        active = false;
      };
    }, [db]),
  );

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
          showBack
          title="Historique sportif"
          subtitle="Tes séances terminées et ton rythme hebdomadaire"
        />

        {stats ? (
          <View className="mt-5 flex-row gap-2.5">
            <AppCard variant="default" className="flex-1 items-center py-4">
              <Text className="text-[24px] font-extrabold text-fitness-primary dark:text-fitness-dark">
                {stats.totalSessions}
              </Text>
              <Text className="mt-1 text-[11px] font-semibold text-muted-light dark:text-muted-dark">
                Séances
              </Text>
            </AppCard>
            <AppCard variant="default" className="flex-1 items-center py-4">
              <Text className="text-[24px] font-extrabold text-ink-light dark:text-ink-dark">
                {Math.round(stats.totalTrainingSeconds / 60)}
              </Text>
              <Text className="mt-1 text-[11px] font-semibold text-muted-light dark:text-muted-dark">
                Minutes
              </Text>
            </AppCard>
            <AppCard variant="default" className="flex-1 items-center py-4">
              <Text className="text-[24px] font-extrabold text-brand-primary dark:text-[#8CC0A0]">
                {stats.currentWeekSessions}
              </Text>
              <Text className="mt-1 text-[11px] font-semibold text-muted-light dark:text-muted-dark">
                Cette semaine
              </Text>
            </AppCard>
          </View>
        ) : null}

        <Text className="mb-3 mt-7 text-[17px] font-bold text-ink-light dark:text-ink-dark">
          Séances terminées
        </Text>

        {isLoading ? (
          <View className="py-10">
            <ActivityIndicator color="#D97736" />
          </View>
        ) : rows.length ? (
          <View className="gap-2.5">
            {rows.map((row) => (
              <AppCard
                key={row.id}
                variant="default"
                className="flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
                    {localizePlan(row.plan_name, "").name}
                  </Text>
                  <Text className="mt-1 text-[12px] text-muted-light dark:text-muted-dark">
                    {new Date(row.started_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Badge label="Terminée" tone="success" />
              </AppCard>
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<FitnessIcon size={24} color={fitnessColor} />}
            title="Aucune séance terminée"
            description="Choisis une zone musculaire dans Fitness pour démarrer ta première séance."
            actionLabel="Explorer le Fitness"
            actionVariant="fitness"
            onAction={() => router.replace("/(tabs)/fitness")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Pressable, Text } from "@/components/LocalizedText";
import { AppCard } from "@/components/ui/AppCard";
import {
  ChevronRightIcon,
  ClockIcon,
  FitnessIcon,
} from "@/components/ui/Icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { MuscleGroupIllustration } from "@/components/workout/WorkoutVisuals";
import { theme } from "@/constants/theme";
import { localizeCategory, localizePlan } from "@/constants/workoutLabels";
import {
  getActiveWorkoutSession,
  getWorkoutCategories,
  getWorkoutStats,
} from "@/services/workouts";
import { useAppSettings } from "@/stores/app-settings";
import type {
  WorkoutCategory,
  WorkoutSession,
  WorkoutStats,
} from "@/types/workout";

export default function WorkoutsScreen() {
  const db = useSQLiteContext();
  const { resolvedColorScheme } = useAppSettings();
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(
    null,
  );
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDark = resolvedColorScheme === "dark";
  const fitnessColor = isDark
    ? theme.colors.fitnessDark
    : theme.colors.fitness;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([
        getWorkoutCategories(db),
        getActiveWorkoutSession(db),
        getWorkoutStats(db),
      ])
        .then(([nextCategories, nextSession, nextStats]) => {
          if (!active) return;
          setCategories(nextCategories);
          setActiveSession(nextSession);
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
          title="Fitness"
          subtitle="Choisis une zone musculaire et avance à ton rythme"
          rightAction={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Historique des entraînements"
              onPress={() => router.push("/workout-history")}
              className="min-h-11 flex-row items-center gap-1.5 rounded-full border border-brand-border bg-surface-light px-3.5 dark:border-selected-dark dark:bg-surface-dark"
            >
              <ClockIcon size={15} color={fitnessColor} />
              <Text className="text-[12px] font-bold text-fitness-primary dark:text-fitness-dark">
                Historique
              </Text>
            </Pressable>
          }
        />

        {/* Séance en cours */}
        {activeSession ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reprendre ${activeSession.plan_name}`}
            onPress={() =>
              router.push({
                pathname: "/active-workout",
                params: { sessionId: String(activeSession.id) },
              })
            }
            className="mt-5"
          >
            <View className="flex-row items-center gap-3.5 rounded-[22px] bg-fitness-primary p-4">
              <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-white/20">
                <FitnessIcon size={22} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-white/85">
                  Séance en cours
                </Text>
                <Text className="mt-0.5 text-[17px] font-extrabold text-white">
                  Reprendre ·{" "}
                  {localizePlan(activeSession.plan_name, "").name}
                </Text>
              </View>
              <ChevronRightIcon size={22} color="#FFFFFF" />
            </View>
          </Pressable>
        ) : null}

        {/* Mini résumé hebdo si l'utilisateur a déjà pratiqué */}
        {stats && stats.totalSessions > 0 ? (
          <AppCard variant="default" className="mt-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[12px] font-semibold text-muted-light dark:text-muted-dark">
                Cette semaine
              </Text>
              <Text className="mt-0.5 text-[16px] font-extrabold text-ink-light dark:text-ink-dark">
                {stats.currentWeekSessions} séance
                {stats.currentWeekSessions > 1 ? "s" : ""} ·{" "}
                {Math.max(1, Math.round(stats.totalTrainingSeconds / 60))} min au total
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/workout-history")}
              className="min-h-9 justify-center px-2"
            >
              <Text className="text-[12px] font-bold text-fitness-primary dark:text-fitness-dark">
                Détails ›
              </Text>
            </Pressable>
          </AppCard>
        ) : null}

        {/* Grille des zones musculaires */}
        <View className="mt-6">
          <Text className="mb-3 text-[17px] font-bold text-ink-light dark:text-ink-dark">
            Zones musculaires
          </Text>

          {isLoading && !categories.length ? (
            <View className="py-10">
              <ActivityIndicator color="#D97736" />
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {categories.map((category) => {
                const localized = localizeCategory(
                  category.slug,
                  category.name,
                  category.description,
                );
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Zone ${localized.name}`}
                    onPress={() =>
                      router.push({
                        pathname: "/workout-plan",
                        params: {
                          categoryId: String(category.id),
                          categorySlug: category.slug,
                        },
                      })
                    }
                    className="w-[48.5%] rounded-[22px] border border-brand-border bg-surface-light p-4 active:opacity-85 dark:border-selected-dark dark:bg-surface-dark"
                  >
                    <View
                      style={{ backgroundColor: category.accent }}
                      className="h-12 w-12 items-center justify-center rounded-[14px]"
                    >
                      <MuscleGroupIllustration slug={category.slug} color={fitnessColor} />
                    </View>
                    <Text className="mt-3 text-[16px] font-extrabold text-ink-light dark:text-ink-dark">
                      {localized.name}
                    </Text>
                    <Text
                      numberOfLines={2}
                      className="mt-1 text-[12px] leading-4 text-muted-light dark:text-muted-dark"
                    >
                      {localized.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

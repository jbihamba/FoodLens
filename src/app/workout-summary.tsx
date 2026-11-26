import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/LocalizedText";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { CheckIcon, FlameIcon } from "@/components/ui/Icons";
import { localizePlan } from "@/constants/workoutLabels";
import {
  createWorkoutSession,
  getSessionExercises,
  getWorkoutSessionById,
  getWorkoutStats,
} from "@/services/workouts";
import type { WorkoutSession, WorkoutStats } from "@/types/workout";

export default function WorkoutSummaryScreen() {
  const db = useSQLiteContext();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [completed, setCompleted] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    void Promise.all([
      getWorkoutSessionById(db, Number(sessionId)),
      getSessionExercises(db, Number(sessionId)),
      getWorkoutStats(db),
    ])
      .then(([nextSession, rows, nextStats]) => {
        if (!active) return;
        setSession(nextSession ?? null);
        const doneRows = rows.filter((row) => row.status === "completed");
        setCompleted(doneRows.length);
        setSkipped(rows.filter((row) => row.status === "skipped").length);
        setActiveSeconds(
          doneRows.reduce((sum, row) => sum + row.duration_seconds, 0),
        );
        setStats(nextStats);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [db, sessionId]);

  const restart = async () => {
    if (!session || isRestarting) return;
    setIsRestarting(true);
    try {
      const nextId = await createWorkoutSession(db, session.plan_id);
      router.replace({
        pathname: "/active-workout",
        params: { sessionId: String(nextId) },
      });
    } finally {
      setIsRestarting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas-light dark:bg-canvas-dark">
        <ActivityIndicator color="#D97736" />
      </SafeAreaView>
    );
  }

  const totalMinutes = Math.max(1, Math.round(activeSeconds / 60));
  const estimatedCalories = Math.round((activeSeconds / 60) * 5.5);

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView
        contentContainerClassName="mx-auto w-full max-w-[560px] flex-grow justify-center px-5 py-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-fitness-softLight dark:bg-fitness-softDark">
            <CheckIcon size={32} color="#D97736" />
          </View>
          <Badge label="Séance terminée" tone="fitness" className="mt-4" />
          <Text className="mt-3 text-center text-[30px] font-extrabold tracking-[-0.5px] text-ink-light dark:text-ink-dark">
            Bien joué !
          </Text>
          {session ? (
            <Text className="mt-1 text-center text-[15px] font-semibold text-muted-light dark:text-muted-dark">
              {localizePlan(session.plan_name, "").name}
            </Text>
          ) : null}
        </View>

        <View className="mt-7 flex-row gap-3">
          <AppCard variant="elevated" className="flex-1 items-center py-5">
            <Text className="text-[26px] font-extrabold text-fitness-primary dark:text-fitness-dark">
              {totalMinutes} min
            </Text>
            <Text className="mt-1 text-[12px] font-semibold text-muted-light dark:text-muted-dark">
              Temps actif
            </Text>
          </AppCard>
          <AppCard variant="elevated" className="flex-1 items-center py-5">
            <Text className="text-[26px] font-extrabold text-ink-light dark:text-ink-dark">
              {completed}
            </Text>
            <Text className="mt-1 text-[12px] font-semibold text-muted-light dark:text-muted-dark">
              Exercice{completed > 1 ? "s" : ""} terminé{completed > 1 ? "s" : ""}
            </Text>
          </AppCard>
        </View>

        <AppCard variant="default" className="mt-3 gap-3">
          {estimatedCalories > 0 ? (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <FlameIcon size={18} color="#D97736" />
                <Text className="text-[14px] font-semibold text-ink-light dark:text-ink-dark">
                  Calories estimées
                </Text>
              </View>
              <Text className="text-[15px] font-bold text-fitness-primary dark:text-fitness-dark">
                ~{estimatedCalories} kcal
              </Text>
            </View>
          ) : null}
          {skipped > 0 ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] text-muted-light dark:text-muted-dark">
                Exercices passés
              </Text>
              <Text className="text-[14px] font-semibold text-ink-light dark:text-ink-dark">
                {skipped}
              </Text>
            </View>
          ) : null}
          {stats ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] text-muted-light dark:text-muted-dark">
                Séances cette semaine
              </Text>
              <Text className="text-[14px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                {stats.currentWeekSessions}
              </Text>
            </View>
          ) : null}
        </AppCard>

        <View className="mt-7 gap-3">
          {session ? (
            <AppButton
              label="Recommencer la séance"
              variant="fitness"
              loading={isRestarting}
              onPress={() => void restart()}
            />
          ) : null}
          <AppButton
            label="Retour au module Fitness"
            variant="secondary"
            onPress={() => router.replace("/(tabs)/fitness")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

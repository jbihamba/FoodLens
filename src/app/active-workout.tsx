import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Pressable, Text } from "@/components/LocalizedText";
import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@/components/ui/Badge";
import {
  CheckIcon,
  PauseIcon,
  PlayIcon,
  SkipIcon,
} from "@/components/ui/Icons";
import { ExerciseMediaDemo } from "@/components/workout/ExerciseMediaDemo";
import { theme } from "@/constants/theme";
import { localizeExercise } from "@/constants/workoutLabels";
import {
  finishWorkoutSession,
  getSessionExercises,
  updateSessionExercise,
} from "@/services/workouts";
import { useAppSettings } from "@/stores/app-settings";
import type { WorkoutSessionExercise } from "@/types/workout";

type Phase = "work" | "rest";

export default function ActiveWorkoutScreen() {
  const db = useSQLiteContext();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { resolvedColorScheme } = useAppSettings();

  const [items, setItems] = useState<WorkoutSessionExercise[]>([]);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>("work");
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdvancingRef = useRef(false);

  const isDark = resolvedColorScheme === "dark";
  const inkColor = isDark ? theme.colors.textDark : theme.colors.textLight;

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    void (async () => {
      const rows = await getSessionExercises(db, Number(sessionId));
      if (!active) return;
      setItems(rows);
      const activeIdx = rows.findIndex(
        (row) => row.status === "in_progress" || row.status === "pending",
      );
      const idx = Math.max(activeIdx, 0);
      setCurrent(idx);
      if (rows[idx]) {
        setRemaining(rows[idx].duration_seconds);
        if (rows[idx].status === "pending") {
          await updateSessionExercise(db, rows[idx].id, "in_progress");
        }
      }
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, sessionId]);

  const finish = useCallback(
    async (status: "completed" | "abandoned") => {
      if (!sessionId || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const totalRest = items.reduce(
          (sum, row, index) =>
            index < items.length - 1 ? sum + row.rest_seconds : sum,
          0,
        );
        await finishWorkoutSession(db, Number(sessionId), status, totalRest);
        if (status === "completed") {
          router.replace({
            pathname: "/workout-summary",
            params: { sessionId: String(sessionId) },
          });
        } else {
          router.replace("/(tabs)/fitness");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [db, isSubmitting, items, sessionId],
  );

  const advance = useCallback(
    async (status: "completed" | "skipped") => {
      const currentItem = items[current];
      if (!currentItem || isAdvancingRef.current) return;
      isAdvancingRef.current = true;
      try {
        await updateSessionExercise(db, currentItem.id, status);
        const updated = items.map((row, idx) =>
          idx === current ? { ...row, status } : row,
        );
        setItems(updated);

        if (current >= items.length - 1) {
          await finish("completed");
          return;
        }

        const nextIndex = current + 1;
        await updateSessionExercise(db, items[nextIndex].id, "in_progress");

        if (status === "completed" && currentItem.rest_seconds > 0) {
          setPhase("rest");
          setCurrent(nextIndex);
          setRemaining(currentItem.rest_seconds);
        } else {
          setPhase("work");
          setCurrent(nextIndex);
          setRemaining(items[nextIndex].duration_seconds);
        }
      } finally {
        isAdvancingRef.current = false;
      }
    },
    [current, db, finish, items],
  );

  // Compte à rebours fiable avec support Pause & Transition Repos -> Travail
  useEffect(() => {
    if (paused || isLoading || !items[current]) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (phase === "rest") {
            setPhase("work");
            return items[current]?.duration_seconds ?? 30;
          }
          void advance("completed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [advance, current, isLoading, items, paused, phase]);

  if (isLoading || !items[current]) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas-light dark:bg-canvas-dark">
        <ActivityIndicator color="#D97736" />
      </SafeAreaView>
    );
  }

  const item = items[current];
  const localized = localizeExercise(
    item.exercise_name,
    item.description ?? "",
    item.targeted_muscles ?? "Corps entier",
    item.equipment ?? null,
  );
  const completedCount = items.filter(
    (row) => row.status === "completed",
  ).length;
  const progressPercent = items.length
    ? Math.round(((current + (phase === "rest" ? 0 : 0)) / items.length) * 100)
    : 0;

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-canvas-light px-5 pt-2 dark:bg-canvas-dark"
    >
      {/* Barre supérieure épurée */}
      <View className="flex-row items-center justify-between">
        <Badge
          label={`Exercice ${current + 1} / ${items.length}`}
          tone="fitness"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quitter la séance"
          onPress={() =>
            Alert.alert(
              "Quitter la séance ?",
              "Tu pourras la reprendre plus tard ou l'abandonner.",
              [
                { text: "Continuer", style: "cancel" },
                {
                  text: "Reprendre plus tard",
                  onPress: () => router.replace("/(tabs)/fitness"),
                },
                {
                  text: "Abandonner",
                  style: "destructive",
                  onPress: () => void finish("abandoned"),
                },
              ],
            )
          }
          className="min-h-11 justify-center px-2"
        >
          <Text className="text-[14px] font-bold text-muted-light dark:text-muted-dark">
            Quitter
          </Text>
        </Pressable>
      </View>

      {/* Barre de progression */}
      <View className="mt-2 h-2 overflow-hidden rounded-full bg-fitness-softLight dark:bg-fitness-softDark">
        <View
          style={{ width: `${Math.max(progressPercent, 8)}%` }}
          className="h-full rounded-full bg-fitness-primary dark:bg-fitness-dark"
        />
      </View>

      {/* Zone centrale dédiée à l'exercice ou au repos */}
      <View className="flex-1 justify-center py-4">
        {phase === "rest" ? (
          <View className="items-center">
            <Badge label="Temps de repos" tone="neutral" />
            <Text className="mt-4 text-[68px] font-extrabold leading-[76px] text-fitness-primary dark:text-fitness-dark">
              {remaining}s
            </Text>
            <Text className="mt-2 text-[14px] text-muted-light dark:text-muted-dark">
              Prochain exercice
            </Text>
            <Text className="mt-1 text-center text-[22px] font-extrabold text-ink-light dark:text-ink-dark">
              {localized.name}
            </Text>
            <View className="mt-8 w-full max-w-[240px]">
              <AppButton
                label="Passer le repos"
                variant="secondary"
                onPress={() => {
                  setPhase("work");
                  setRemaining(item.duration_seconds);
                }}
              />
            </View>
          </View>
        ) : (
          <View>
            <ExerciseMediaDemo exercise={item} height={220} />

            <View className="mt-5 items-center">
              <Text className="text-center text-[26px] font-extrabold tracking-[-0.5px] text-ink-light dark:text-ink-dark">
                {localized.name}
              </Text>
              <Text className="mt-1 text-center text-[13px] text-muted-light dark:text-muted-dark">
                {localized.muscles}
              </Text>

              <Text className="mt-4 text-[64px] font-extrabold leading-[72px] text-fitness-primary dark:text-fitness-dark">
                {remaining}s
              </Text>
              <Text className="text-[12px] font-semibold text-muted-light dark:text-muted-dark">
                {paused ? "En pause" : `${completedCount} terminé(s)`}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Commandes claires en bas */}
      <View className="gap-2.5 pb-4">
        <AppButton
          label={paused ? "Reprendre" : "Pause"}
          variant="fitness"
          icon={
            paused ? (
              <PlayIcon size={18} color="#FFFFFF" />
            ) : (
              <PauseIcon size={18} color="#FFFFFF" />
            )
          }
          onPress={() => setPaused((p) => !p)}
        />
        {phase === "work" ? (
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <AppButton
                label="Passer"
                variant="secondary"
                icon={<SkipIcon size={16} color={inkColor} />}
                onPress={() => void advance("skipped")}
              />
            </View>
            <View className="flex-1">
              <AppButton
                label="Terminer"
                variant="primary"
                icon={<CheckIcon size={16} color="#FFFFFF" />}
                onPress={() => void advance("completed")}
              />
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

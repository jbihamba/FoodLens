import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/LocalizedText";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { PlayIcon } from "@/components/ui/Icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ExerciseMediaDemo } from "@/components/workout/ExerciseMediaDemo";
import { DIFFICULTY_LABELS, localizeExercise } from "@/constants/workoutLabels";
import { createWorkoutSession, getExerciseDetails } from "@/services/workouts";
import type { ExerciseDetails } from "@/types/workout";

export default function ExerciseDetailsScreen() {
  const db = useSQLiteContext();
  const { planExerciseId } = useLocalSearchParams<{ planExerciseId: string }>();
  const [exercise, setExercise] = useState<ExerciseDetails | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!planExerciseId) return;
    let active = true;
    void getExerciseDetails(db, Number(planExerciseId)).then((data) => {
      if (active) setExercise(data);
    });
    return () => {
      active = false;
    };
  }, [db, planExerciseId]);

  const start = async () => {
    if (!exercise || isStarting) return;
    setIsStarting(true);
    try {
      const sessionId = await createWorkoutSession(db, exercise.plan_id);
      router.replace({
        pathname: "/active-workout",
        params: { sessionId: String(sessionId) },
      });
    } finally {
      setIsStarting(false);
    }
  };

  if (!exercise) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas-light dark:bg-canvas-dark">
        <ActivityIndicator color="#D97736" />
      </SafeAreaView>
    );
  }

  const localized = localizeExercise(
    exercise.name,
    exercise.description,
    exercise.targeted_muscles,
    exercise.equipment,
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
          title={localized.name}
          subtitle={localized.description}
        />

        <View className="mt-5">
          <ExerciseMediaDemo exercise={exercise} height={240} />
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Badge label={localized.muscles} tone="fitness" />
          <Badge
            label={DIFFICULTY_LABELS[exercise.plan_difficulty]}
            tone="neutral"
          />
          <Badge
            label={
              exercise.repetitions
                ? `${exercise.repetitions} répétitions`
                : `${exercise.duration_seconds}s d'effort`
            }
            tone="neutral"
          />
          <Badge label={`${exercise.rest_seconds}s de repos`} tone="neutral" />
        </View>

        <AppCard variant="default" className="mt-5">
          <Text className="text-[16px] font-bold text-ink-light dark:text-ink-dark">
            Comment réaliser l&apos;exercice
          </Text>
          <Text className="mt-2.5 text-[14px] leading-6 text-muted-light dark:text-muted-dark">
            {exercise.instructions}
          </Text>
          <View className="mt-4 border-t border-brand-border pt-3 dark:border-selected-dark">
            <Text className="text-[13px] font-bold text-fitness-primary dark:text-fitness-dark">
              Équipement · {localized.equipment}
            </Text>
          </View>
          {exercise.media_attribution ? (
            <Text className="mt-2 text-[10px] leading-4 text-muted-light dark:text-muted-dark">
              Média · {exercise.media_attribution} · {exercise.media_license}
            </Text>
          ) : null}
        </AppCard>

        <View className="mt-6">
          <AppButton
            label="Commencer la séance"
            variant="fitness"
            loading={isStarting}
            icon={<PlayIcon size={18} color="#FFFFFF" />}
            onPress={() => void start()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

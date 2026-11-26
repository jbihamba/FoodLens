import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Pressable, Text } from "@/components/LocalizedText";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import {
  ChevronRightIcon,
  ClockIcon,
  PlayIcon,
} from "@/components/ui/Icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { theme } from "@/constants/theme";
import {
  DIFFICULTY_LABELS,
  formatDurationMinutes,
  localizeCategory,
  localizeExercise,
  localizePlan,
} from "@/constants/workoutLabels";
import {
  createWorkoutSession,
  getPlanExercises,
  getWorkoutPlans,
} from "@/services/workouts";
import { useAppSettings } from "@/stores/app-settings";
import type { WorkoutPlan, WorkoutPlanExercise } from "@/types/workout";

export default function WorkoutPlanScreen() {
  const db = useSQLiteContext();
  const { categoryId, categorySlug } = useLocalSearchParams<{
    categoryId: string;
    categorySlug?: string;
  }>();
  const { resolvedColorScheme } = useAppSettings();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selected, setSelected] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<WorkoutPlanExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const isDark = resolvedColorScheme === "dark";
  const fitnessColor = isDark
    ? theme.colors.fitnessDark
    : theme.colors.fitness;

  useEffect(() => {
    if (!categoryId) return;
    let active = true;
    void (async () => {
      try {
        const rows = await getWorkoutPlans(db, Number(categoryId));
        if (!active) return;
        setPlans(rows);
        if (rows[0]) {
          setSelected(rows[0]);
          const planExercises = await getPlanExercises(db, rows[0].id);
          if (active) setExercises(planExercises);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [categoryId, db]);

  const choose = async (plan: WorkoutPlan) => {
    setSelected(plan);
    setExercises(await getPlanExercises(db, plan.id));
  };

  const start = async () => {
    if (!selected || isStarting) return;
    setIsStarting(true);
    try {
      const id = await createWorkoutSession(db, selected.id);
      router.replace({
        pathname: "/active-workout",
        params: { sessionId: String(id) },
      });
    } finally {
      setIsStarting(false);
    }
  };

  const categoryTitle = selected
    ? localizeCategory(categorySlug ?? "", selected.category_name, "").name
    : "Programmes";

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
          eyebrow="Programme"
          title={categoryTitle}
          subtitle="Sélectionne une séance et consulte les exercices"
        />

        {isLoading ? (
          <View className="py-12">
            <ActivityIndicator color="#D97736" />
          </View>
        ) : (
          <>
            {/* Liste des programmes */}
            <View className="mt-5 gap-3">
              {plans.map((plan) => {
                const isSelected = selected?.id === plan.id;
                const localized = localizePlan(plan.name, plan.description);
                return (
                  <Pressable
                    key={plan.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => void choose(plan)}
                    className={`rounded-[22px] border p-4 ${
                      isSelected
                        ? "border-fitness-primary bg-fitness-softLight dark:border-fitness-dark dark:bg-fitness-softDark"
                        : "border-brand-border bg-surface-light dark:border-selected-dark dark:bg-surface-dark"
                    }`}
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-[17px] font-extrabold text-ink-light dark:text-ink-dark">
                          {localized.name}
                        </Text>
                        <Text className="mt-1 text-[13px] leading-5 text-muted-light dark:text-muted-dark">
                          {localized.description}
                        </Text>
                      </View>
                      <Badge
                        label={DIFFICULTY_LABELS[plan.difficulty]}
                        tone={isSelected ? "fitness" : "neutral"}
                      />
                    </View>

                    <View className="mt-3 flex-row items-center gap-4 border-t border-brand-border/60 pt-3 dark:border-selected-dark">
                      <View className="flex-row items-center gap-1.5">
                        <ClockIcon size={14} color={fitnessColor} />
                        <Text className="text-[12px] font-bold text-ink-light dark:text-ink-dark">
                          {formatDurationMinutes(plan.duration_seconds)}
                        </Text>
                      </View>
                      <Text className="text-[12px] font-semibold text-muted-light dark:text-muted-dark">
                        {plan.exercise_count} exercice
                        {plan.exercise_count > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Détail du workout sélectionné */}
            {selected ? (
              <View className="mt-6">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
                    Exercices ({exercises.length})
                  </Text>
                  <Text className="text-[12px] text-muted-light dark:text-muted-dark">
                    Appuie pour voir la démo
                  </Text>
                </View>

                <View className="gap-2.5">
                  {exercises.map((exercise, index) => {
                    const localized = localizeExercise(
                      exercise.name,
                      exercise.description,
                      exercise.targeted_muscles,
                      exercise.equipment,
                    );
                    return (
                      <Pressable
                        key={exercise.plan_exercise_id}
                        accessibilityRole="button"
                        accessibilityLabel={`Voir ${localized.name}`}
                        onPress={() =>
                          router.push({
                            pathname: "/exercise-details",
                            params: {
                              planExerciseId: String(exercise.plan_exercise_id),
                            },
                          })
                        }
                      >
                        <AppCard className="flex-row items-center gap-3">
                          <View className="h-9 w-9 items-center justify-center rounded-full bg-fitness-softLight dark:bg-fitness-softDark">
                            <Text className="text-[13px] font-extrabold text-fitness-primary dark:text-fitness-dark">
                              {index + 1}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
                              {localized.name}
                            </Text>
                            <Text
                              numberOfLines={1}
                              className="mt-0.5 text-[12px] text-muted-light dark:text-muted-dark"
                            >
                              {exercise.repetitions
                                ? `${exercise.repetitions} répétitions`
                                : `${exercise.duration_seconds}s`}{" "}
                              · {exercise.rest_seconds}s repos ·{" "}
                              {localized.muscles}
                            </Text>
                          </View>
                          <ChevronRightIcon size={18} color={fitnessColor} />
                        </AppCard>
                      </Pressable>
                    );
                  })}
                </View>

                <View className="mt-6">
                  <AppButton
                    label="Commencer la séance"
                    variant="fitness"
                    loading={isStarting}
                    icon={<PlayIcon size={18} color="#FFFFFF" />}
                    onPress={() => void start()}
                  />
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

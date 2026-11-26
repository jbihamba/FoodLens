import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";

import { ExerciseMediaDemo } from "@/components/workout/ExerciseMediaDemo";
import { Pressable, Text } from "@/components/LocalizedText";
import { createWorkoutSession, getExerciseDetails } from "@/services/workouts";
import type { ExerciseDetails } from "@/types/workout";

export default function ExerciseDetailsScreen() {
  const db = useSQLiteContext();
  const { planExerciseId } = useLocalSearchParams<{ planExerciseId: string }>();
  const [exercise, setExercise] = useState<ExerciseDetails | null>(null);
  useEffect(() => { if (planExerciseId) void getExerciseDetails(db, Number(planExerciseId)).then(setExercise); }, [db, planExerciseId]);
  const start = async () => { if (!exercise) return; const sessionId = await createWorkoutSession(db, exercise.plan_id); router.replace({ pathname: "/active-workout", params: { sessionId: String(sessionId) } }); };
  if (!exercise) return <SafeAreaView className="flex-1 items-center justify-center bg-canvas-light dark:bg-canvas-dark"><ActivityIndicator color="#245C45" /></SafeAreaView>;
  return <SafeAreaView edges={["top"]} className="flex-1 bg-canvas-light dark:bg-canvas-dark"><ScrollView contentContainerClassName="px-5 pb-10 pt-4"><Pressable onPress={() => router.back()} className="min-h-11 justify-center"><Text className="font-bold text-brand-primary">← Retour</Text></Pressable><Text className="mt-3 text-[30px] font-extrabold text-ink-light dark:text-ink-dark">{exercise.name}</Text><Text className="mt-2 text-[14px] leading-5 text-muted-light dark:text-muted-dark">{exercise.description}</Text><View className="mt-5"><ExerciseMediaDemo exercise={exercise} /></View><View className="mt-5 flex-row flex-wrap gap-2"><Text className="rounded-full bg-brand-secondary px-3 py-2 text-[12px] font-bold text-brand-primary">Muscles · {exercise.targeted_muscles}</Text><Text className="rounded-full bg-surface-light px-3 py-2 text-[12px] font-bold text-ink-light dark:bg-surface-dark dark:text-ink-dark">{exercise.plan_difficulty}</Text><Text className="rounded-full bg-surface-light px-3 py-2 text-[12px] font-bold text-ink-light dark:bg-surface-dark dark:text-ink-dark">{exercise.duration_seconds}s de travail</Text><Text className="rounded-full bg-surface-light px-3 py-2 text-[12px] font-bold text-ink-light dark:bg-surface-dark dark:text-ink-dark">{exercise.rest_seconds}s de repos</Text></View><View className="mt-6 rounded-[20px] bg-surface-light p-5 dark:bg-surface-dark"><Text className="text-[18px] font-extrabold text-ink-light dark:text-ink-dark">Instructions</Text><Text className="mt-3 text-[15px] leading-6 text-muted-light dark:text-muted-dark">{exercise.instructions}</Text><Text className="mt-4 text-[13px] font-bold text-brand-primary">Équipement · {exercise.equipment ?? "Aucun"}</Text>{exercise.media_attribution ? <Text className="mt-4 text-[10px] leading-4 text-muted-light dark:text-muted-dark">Média · {exercise.media_attribution} · {exercise.media_license} · {exercise.media_source}</Text> : null}</View><Pressable onPress={() => void start()} className="mt-6 min-h-14 items-center justify-center rounded-full bg-brand-primary"><Text className="font-extrabold text-white">Commencer la séance</Text></Pressable></ScrollView></SafeAreaView>;
}

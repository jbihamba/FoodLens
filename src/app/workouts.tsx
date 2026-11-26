import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";

import { Pressable, Text } from "@/components/LocalizedText";
import { getActiveWorkoutSession, getWorkoutCategories } from "@/services/workouts";
import type { WorkoutCategory, WorkoutSession } from "@/types/workout";

export default function WorkoutsScreen() {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  useFocusEffect(useCallback(() => { void Promise.all([getWorkoutCategories(db), getActiveWorkoutSession(db)]).then(([nextCategories, nextSession]) => { setCategories(nextCategories); setActiveSession(nextSession); }); }, [db]));
  return <SafeAreaView edges={["top"]} className="flex-1 bg-canvas-light dark:bg-canvas-dark">
    <ScrollView contentContainerClassName="px-5 pb-10 pt-4" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between"><View><Text className="text-[13px] font-semibold text-muted-light dark:text-muted-dark">FoodLens</Text><Text className="text-[28px] font-extrabold text-ink-light dark:text-ink-dark">Entraînement</Text></View><Pressable onPress={() => router.push("/workout-history")} className="min-h-11 justify-center px-2"><Text className="font-bold text-brand-primary">Historique</Text></Pressable></View>
      <Text className="mt-2 text-[14px] leading-5 text-muted-light dark:text-muted-dark">Choisis une zone et avance à ton rythme. Aucun équipement obligatoire.</Text>
      {activeSession ? <Pressable onPress={() => router.push({ pathname: "/active-workout", params: { sessionId: String(activeSession.id) } })} className="mt-5 rounded-[20px] bg-brand-primary p-4"><Text className="text-[12px] font-bold text-white/80">Séance en cours</Text><Text className="mt-1 text-[17px] font-extrabold text-white">Reprendre · {activeSession.plan_name}</Text></Pressable> : null}
      <Text className="mb-3 mt-7 text-[18px] font-extrabold text-ink-light dark:text-ink-dark">Explorer par zone</Text>
      {!categories.length ? <ActivityIndicator color="#245C45" /> : <View className="gap-3">{categories.map((category) => <Pressable key={category.id} onPress={() => router.push({ pathname: "/workout-plan", params: { categoryId: String(category.id) } })} className="flex-row items-center rounded-[22px] bg-surface-light p-4 dark:bg-surface-dark"><View style={{ backgroundColor: category.accent }} className="h-16 w-16 items-center justify-center rounded-[18px]"><Text className="text-[30px]">{category.icon}</Text></View><View className="ml-4 flex-1"><Text className="text-[17px] font-extrabold text-ink-light dark:text-ink-dark">{category.name}</Text><Text className="mt-1 text-[12px] leading-4 text-muted-light dark:text-muted-dark">{category.description}</Text></View><Text className="text-[24px] text-brand-primary">›</Text></Pressable>)}</View>}
    </ScrollView>
  </SafeAreaView>;
}

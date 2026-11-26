import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { getSessionExercises, getWorkoutHistory } from "@/services/workouts";
import { Pressable, Text } from "@/components/LocalizedText";
export default function WorkoutSummaryScreen() { const db = useSQLiteContext(); const { sessionId } = useLocalSearchParams<{ sessionId: string }>(); const [completed, setCompleted] = useState(0); const [skipped, setSkipped] = useState(0); useEffect(() => { void getSessionExercises(db, Number(sessionId)).then((rows) => { setCompleted(rows.filter((row) => row.status === "completed").length); setSkipped(rows.filter((row) => row.status === "skipped").length); }); }, [db, sessionId]); return <SafeAreaView className="flex-1 items-center justify-center bg-canvas-light px-5 dark:bg-canvas-dark"><Text className="text-[18px] font-bold text-brand-primary">Séance enregistrée</Text><Text className="mt-3 text-center text-[30px] font-extrabold text-ink-light dark:text-ink-dark">Bien joué !</Text><Text className="mt-3 text-center text-muted-light">{completed} exercice(s) terminé(s) · {skipped} passé(s)</Text><Pressable onPress={() => router.replace("/workouts")} className="mt-8 min-h-14 w-full items-center justify-center rounded-full bg-brand-primary"><Text className="font-extrabold text-white">Retour au centre</Text></Pressable></SafeAreaView>; }

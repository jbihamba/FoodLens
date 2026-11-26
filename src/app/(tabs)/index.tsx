import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalorieRing } from "@/components/food/CalorieRing";
import { MealCard } from "@/components/food/MealCard";
import { Pressable, Text } from "@/components/LocalizedText";
import { TipsCard } from "@/components/TipsCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BarcodeIcon,
  CameraIcon,
  ChevronRightIcon,
  FitnessIcon,
  PlusIcon,
  ProgressIcon,
  SettingsIcon,
} from "@/components/ui/Icons";
import { theme } from "@/constants/theme";
import { translateTip } from "@/i18n/tips";
import { DEFAULT_DAILY_GOAL } from "@/services/calorieTracking";
import { getActiveWorkoutSession, getWorkoutStats } from "@/services/workouts";
import { useAppSettings } from "@/stores/app-settings";
import { useDailyCalories } from "@/stores/daily-calories";
import { useTips } from "@/stores/tips";
import type { WorkoutSession, WorkoutStats } from "@/types/workout";

function CompactMacro({ label, value }: { label: string; value: number | null }) {
  return (
    <View className="flex-1 items-center rounded-[14px] bg-canvas-light px-2 py-2.5 dark:bg-canvas-dark">
      <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
        {value === null ? "—" : `${Math.round(value)} g`}
      </Text>
      <Text className="mt-0.5 text-[11px] font-medium text-muted-light dark:text-muted-dark">
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const db = useSQLiteContext();
  const { goal, entries, isLoading, error, refresh } = useDailyCalories();
  const { tips, dismissTip } = useTips();
  const { settings, resolvedColorScheme } = useAppSettings();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(
    null,
  );
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);

  const isDark = resolvedColorScheme === "dark";
  const accentColor = isDark ? theme.colors.accentDark : theme.colors.accent;
  const fitnessColor = isDark
    ? theme.colors.fitnessDark
    : theme.colors.fitness;
  const inkColor = isDark ? theme.colors.textDark : theme.colors.textLight;

  const targetCalories = goal?.target_calories ?? DEFAULT_DAILY_GOAL;
  const consumed = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const macros = {
    protein: entries.some((entry) => entry.protein_g !== null)
      ? entries.reduce((sum, entry) => sum + (entry.protein_g ?? 0), 0)
      : null,
    carbs: entries.some((entry) => entry.carbs_g !== null)
      ? entries.reduce((sum, entry) => sum + (entry.carbs_g ?? 0), 0)
      : null,
    fat: entries.some((entry) => entry.fat_g !== null)
      ? entries.reduce((sum, entry) => sum + (entry.fat_g ?? 0), 0)
      : null,
  };

  useFocusEffect(
    useCallback(() => {
      void refresh().catch(() => undefined);
      void Promise.all([
        getActiveWorkoutSession(db),
        getWorkoutStats(db),
      ])
        .then(([session, nextStats]) => {
          setActiveSession(session);
          setWorkoutStats(nextStats);
        })
        .catch(() => undefined);
    }, [db, refresh]),
  );

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const firstName = settings.profile.displayName.trim().split(/\s+/)[0];
  const greeting = firstName ? `Bonjour, ${firstName}` : "Bonjour !";
  const recentEntries = entries.slice(0, 2);

  const fitnessCard = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        activeSession
          ? `Reprendre la séance ${activeSession.plan_name}`
          : "Découvrir les entraînements"
      }
      onPress={() => {
        if (activeSession) {
          router.push({
            pathname: "/active-workout",
            params: { sessionId: String(activeSession.id) },
          });
        } else {
          router.push("/(tabs)/fitness");
        }
      }}
    >
      <AppCard variant="fitness" className="flex-row items-center gap-3.5">
        <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-surface-light dark:bg-surface-dark">
          <FitnessIcon size={22} color={fitnessColor} />
        </View>
        <View className="flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-fitness-primary dark:text-fitness-dark">
            {activeSession ? "Séance en cours" : "Fitness du jour"}
          </Text>
          <Text className="mt-0.5 text-[16px] font-bold text-ink-light dark:text-ink-dark">
            {activeSession
              ? `Reprendre · ${activeSession.plan_name}`
              : "Choisir un entraînement"}
          </Text>
          <Text className="mt-0.5 text-[12px] text-muted-light dark:text-muted-dark">
            {activeSession
              ? `${activeSession.category_name} · Appuyez pour continuer`
              : workoutStats && workoutStats.currentWeekSessions > 0
                ? `${workoutStats.currentWeekSessions} séance(s) cette semaine`
                : "Séances guidées par zone musculaire"}
          </Text>
        </View>
        <ChevronRightIcon size={20} color={fitnessColor} />
      </AppCard>
    </Pressable>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-canvas-light dark:bg-canvas-dark"
    >
      <ScrollView
        contentContainerClassName="mx-auto w-full max-w-[560px] px-5 pb-8 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {/* Header personnalisé */}
        <View className="min-h-[58px] flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[12px] font-semibold capitalize text-muted-light dark:text-muted-dark">
              {todayLabel}
            </Text>
            <Text className="mt-0.5 text-[26px] font-extrabold tracking-[-0.5px] text-ink-light dark:text-ink-dark">
              {greeting}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les réglages"
            onPress={() => router.push("/settings")}
            className="h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-surface-light dark:border-selected-dark dark:bg-surface-dark"
          >
            <SettingsIcon size={20} color={inkColor} />
          </Pressable>
        </View>

        {/* Résumé de la journée */}
        <AppCard variant="elevated" className="mt-4 items-center">
          <View className="mb-3 w-full flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
              Résumé du jour
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Modifier l'objectif calorique"
              onPress={() => router.push("/goal")}
              className="min-h-9 justify-center rounded-full bg-brand-secondary px-3 dark:bg-selected-dark"
            >
              <Text className="text-[12px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                Objectif · {targetCalories.toLocaleString("fr-FR")} kcal
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View className="py-12">
              <ActivityIndicator color="#245C45" />
            </View>
          ) : (
            <CalorieRing consumed={consumed} goal={targetCalories} size={180} />
          )}

          <View className="mt-4 w-full flex-row gap-2">
            <CompactMacro label="Protéines" value={macros.protein} />
            <CompactMacro label="Glucides" value={macros.carbs} />
            <CompactMacro label="Lipides" value={macros.fat} />
          </View>
        </AppCard>

        {/* Action principale : Scanner un repas */}
        <View className="mt-4">
          <AppButton
            label="Scanner un repas"
            variant="primary"
            icon={<CameraIcon size={20} color="#FFFFFF" />}
            onPress={() => router.push("/scanner")}
            accessibilityHint="Ouvre la caméra pour analyser un aliment"
          />

          <View className="mt-2.5 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scanner un code-barres"
              onPress={() =>
                router.push({ pathname: "/scanner", params: { mode: "barcode" } })
              }
              className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-[14px] border border-brand-border bg-surface-light px-3 dark:border-selected-dark dark:bg-surface-dark"
            >
              <BarcodeIcon size={17} color={accentColor} />
              <Text className="text-[13px] font-semibold text-ink-light dark:text-ink-dark">
                Code-barres
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajouter un repas manuellement"
              onPress={() => router.push("/entry")}
              className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-[14px] border border-brand-border bg-surface-light px-3 dark:border-selected-dark dark:bg-surface-dark"
            >
              <PlusIcon size={17} color={accentColor} />
              <Text className="text-[13px] font-semibold text-ink-light dark:text-ink-dark">
                Ajout manuel
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bloc Fitness du jour (priorisé si focus fitness ou séance active) */}
        <View className="mt-5">{fitnessCard}</View>

        {/* Aperçu progression / conseil contextuel */}
        {tips.length > 0 ? (
          <View className="mt-5">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
                {translateTip("tips.ui.day", settings.language)}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/stats")}
                className="min-h-9 flex-row items-center gap-1 px-1"
              >
                <ProgressIcon size={14} color={accentColor} />
                <Text className="text-[12px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                  Progression
                </Text>
              </Pressable>
            </View>
            <TipsCard
              tip={tips[0]}
              onDismiss={(ruleId) =>
                void dismissTip(ruleId).catch(() => undefined)
              }
            />
          </View>
        ) : null}

        {/* Aperçu des derniers repas (sans dupliquer tout le journal) */}
        <View className="mt-5">
          <View className="mb-2.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-[16px] font-bold text-ink-light dark:text-ink-dark">
                Repas récents
              </Text>
              {entries.length > 0 ? (
                <Badge label={`${entries.length}`} tone="nutrition" />
              ) : null}
            </View>
            {entries.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/journal")}
                className="min-h-9 justify-center px-1"
              >
                <Text className="text-[12px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                  Tout voir ›
                </Text>
              </Pressable>
            ) : null}
          </View>

          {error ? (
            <Text
              accessibilityRole="alert"
              className="mb-2 text-[12px] text-danger-light dark:text-danger-dark"
            >
              {error}
            </Text>
          ) : null}

          {recentEntries.length > 0 ? (
            <View className="gap-2">
              {recentEntries.map((entry) => (
                <MealCard
                  key={entry.id}
                  entry={entry}
                  onPress={() =>
                    router.push({
                      pathname: "/entry",
                      params: { id: String(entry.id) },
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<CameraIcon size={24} color={accentColor} />}
              title="Aucun repas enregistré"
              description="Prends une photo de ton plat pour obtenir ses calories et nutriments en quelques secondes."
              actionLabel="Scanner mon premier repas"
              onAction={() => router.push("/scanner")}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

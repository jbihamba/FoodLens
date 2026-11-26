import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalorieProgressBar } from "@/components/food/CalorieProgressBar";
import { MealCard } from "@/components/food/MealCard";
import { Pressable, Text } from "@/components/LocalizedText";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BarcodeIcon,
  CalendarIcon,
  CameraIcon,
  NutritionIcon,
  PlusIcon,
} from "@/components/ui/Icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { theme } from "@/constants/theme";
import { DEFAULT_DAILY_GOAL, type FoodEntry } from "@/services/calorieTracking";
import { useAppSettings } from "@/stores/app-settings";
import { useDailyCalories } from "@/stores/daily-calories";

export default function NutritionScreen() {
  const { goal, entries, isLoading, error, refresh, deleteEntry } =
    useDailyCalories();
  const { resolvedColorScheme } = useAppSettings();
  const [pendingDelete, setPendingDelete] = useState<FoodEntry | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDark = resolvedColorScheme === "dark";
  const accentColor = isDark ? theme.colors.accentDark : theme.colors.accent;

  const target = goal?.target_calories ?? DEFAULT_DAILY_GOAL;
  const consumed = entries.reduce((sum, entry) => sum + entry.calories, 0);

  useFocusEffect(
    useCallback(() => {
      void refresh().catch(() => undefined);
    }, [refresh]),
  );

  const confirmDelete = async () => {
    if (!pendingDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteEntry(pendingDelete.id);
      setPendingDelete(null);
    } catch (cause) {
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : "Impossible de supprimer ce repas.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

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
          title="Nutrition"
          subtitle="Scanne tes repas et suis ton équilibre"
          rightAction={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le calendrier alimentaire"
              onPress={() => router.push("/calendar")}
              className="h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-surface-light dark:border-selected-dark dark:bg-surface-dark"
            >
              <CalendarIcon size={19} color={accentColor} />
            </Pressable>
          }
        />

        {/* Résumé calorique compact */}
        <AppCard variant="elevated" className="mt-5">
          <View className="flex-row items-baseline justify-between">
            <View>
              <Text className="text-[12px] font-semibold text-muted-light dark:text-muted-dark">
                Aujourd&apos;hui
              </Text>
              <Text className="mt-1 text-[26px] font-extrabold text-ink-light dark:text-ink-dark">
                {Math.round(consumed).toLocaleString("fr-FR")}{" "}
                <Text className="text-[14px] font-semibold text-muted-light dark:text-muted-dark">
                  / {target.toLocaleString("fr-FR")} kcal
                </Text>
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/goal")}
              className="min-h-9 justify-center rounded-full bg-brand-secondary px-3 dark:bg-selected-dark"
            >
              <Text className="text-[12px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                Modifier l&apos;objectif
              </Text>
            </Pressable>
          </View>
          <View className="mt-3">
            <CalorieProgressBar
              progress={(consumed / target) * 100}
              isGoalReached={consumed >= target}
            />
          </View>
        </AppCard>

        {/* Actions de saisie alimentaire */}
        <View className="mt-4">
          <AppButton
            label="Scanner un plat"
            variant="primary"
            icon={<CameraIcon size={20} color="#FFFFFF" />}
            onPress={() => router.push("/scanner")}
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

        {/* Journal du jour */}
        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
              Repas du jour · {entries.length}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/calendar")}
              className="min-h-9 justify-center px-1"
            >
              <Text className="text-[12px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                Historique ›
              </Text>
            </Pressable>
          </View>

          {error ? (
            <Text
              accessibilityRole="alert"
              className="mb-3 text-[12px] text-danger-light dark:text-danger-dark"
            >
              {error}
            </Text>
          ) : null}

          {isLoading ? (
            <View className="py-8">
              <ActivityIndicator color="#245C45" />
            </View>
          ) : entries.length ? (
            <View className="gap-2.5">
              {entries.map((entry) => (
                <MealCard
                  key={entry.id}
                  entry={entry}
                  onPress={() =>
                    router.push({
                      pathname: "/entry",
                      params: { id: String(entry.id) },
                    })
                  }
                  onDelete={() => setPendingDelete(entry)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<NutritionIcon size={24} color={accentColor} />}
              title="Ton journal est prêt"
              description="Scanne un repas, un code-barres ou ajoute un aliment manuellement pour le retrouver ici."
            />
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={pendingDelete !== null}
        onRequestClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full max-w-[390px] rounded-[24px] bg-surface-light p-5 dark:bg-surface-dark">
            <Text className="text-[19px] font-bold text-ink-light dark:text-ink-dark">
              Supprimer ce repas ?
            </Text>
            <Text className="mt-2 text-[13px] leading-5 text-muted-light dark:text-muted-dark">
              {pendingDelete?.food_name}
            </Text>
            {deleteError ? (
              <Text
                accessibilityRole="alert"
                className="mt-3 text-xs text-danger-light dark:text-danger-dark"
              >
                {deleteError}
              </Text>
            ) : null}
            <View className="mt-5 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => setPendingDelete(null)}
                className="min-h-11 flex-1 items-center justify-center rounded-[15px] bg-canvas-light dark:bg-canvas-dark"
              >
                <Text className="font-bold text-ink-light dark:text-ink-dark">
                  Annuler
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => void confirmDelete()}
                className="min-h-11 flex-1 items-center justify-center rounded-[15px] bg-danger-light"
              >
                <Text className="font-bold text-white">Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

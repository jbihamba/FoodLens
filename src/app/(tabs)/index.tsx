import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalorieRing } from "@/components/food/CalorieRing";
import { MealCard } from "@/components/food/MealCard";
import { ScanButton } from "@/components/food/ScanButton";
import { Pressable, Text } from "@/components/LocalizedText";
import { TipsCard, TipsEmptyState } from "@/components/TipsCard";
import { translateTip } from "@/i18n/tips";
import { DEFAULT_DAILY_GOAL, type FoodEntry } from "@/services/calorieTracking";
import { useDailyCalories } from "@/stores/daily-calories";
import { useAppSettings } from "@/stores/app-settings";
import { useTips } from "@/stores/tips";

function MacroValue({ label, value }: { label: string; value: number | null }) {
  return (
    <View className="flex-1 items-center rounded-[16px] bg-canvas-light px-2 py-3 dark:bg-canvas-dark">
      <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
        {value === null ? "—" : `${Math.round(value)} g`}
      </Text>
      <Text className="mt-1 text-[11px] font-medium text-muted-light dark:text-muted-dark">
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { goal, entries, isLoading, error, refresh, deleteEntry } =
    useDailyCalories();
  const { tips, stats, error: tipsError, refreshTips, dismissTip } = useTips();
  const { settings } = useAppSettings();
  const [pendingDelete, setPendingDelete] = useState<FoodEntry | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const consumed = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const macros = {
    proteines: entries.some((entry) => entry.protein_g !== null)
      ? entries.reduce((sum, entry) => sum + (entry.protein_g ?? 0), 0)
      : null,
    glucides: entries.some((entry) => entry.carbs_g !== null)
      ? entries.reduce((sum, entry) => sum + (entry.carbs_g ?? 0), 0)
      : null,
    lipides: entries.some((entry) => entry.fat_g !== null)
      ? entries.reduce((sum, entry) => sum + (entry.fat_g ?? 0), 0)
      : null,
  };

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
        contentContainerClassName="mx-auto w-full max-w-[560px] px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="min-h-[60px] flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] font-semibold text-muted-light dark:text-muted-dark">
              FoodLens
            </Text>
            <Text className="text-[22px] font-extrabold text-ink-light dark:text-ink-dark">
              Bonjour !
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les réglages"
            onPress={() => router.push("/settings")}
            className="min-h-11 min-w-11 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark"
          >
            <Text className="text-[18px] text-ink-light dark:text-ink-dark">
              ⚙
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 items-center rounded-[25px] border border-selected-light bg-surface-light px-5 py-5 dark:border-selected-dark dark:bg-surface-dark">
          <View className="mb-3 w-full flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
              Calories du jour
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Modifier l’objectif calorique"
              onPress={() => router.push("/goal")}
              className="min-h-11 min-w-11 items-center justify-center rounded-full"
            >
              <Text className="text-[13px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                Objectif · {goal?.target_calories ?? DEFAULT_DAILY_GOAL}
              </Text>
            </Pressable>
          </View>
          {isLoading ? (
            <ActivityIndicator color="#245C45" />
          ) : (
            <CalorieRing
              consumed={consumed}
              goal={goal?.target_calories ?? DEFAULT_DAILY_GOAL}
            />
          )}
        </View>

        <View className="mt-4">
          <ScanButton onPress={() => router.push("/scanner")} />
        </View>
        <View className="mt-4 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajouter un repas manuellement"
            onPress={() => router.push("/entry")}
            className="min-h-11 flex-1 items-center justify-center rounded-full bg-surface-light px-2 dark:bg-surface-dark"
          >
            <Text className="text-center text-[11px] font-semibold text-ink-light dark:text-ink-dark">
              ＋ Manuel
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scanner un code-barres"
            onPress={() =>
              router.push({ pathname: "/scanner", params: { mode: "barcode" } })
            }
            className="min-h-11 flex-1 items-center justify-center rounded-full bg-surface-light px-2 dark:bg-surface-dark"
          >
            <Text className="text-center text-[11px] font-semibold text-ink-light dark:text-ink-dark">
              Code-barres
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le calendrier alimentaire"
            onPress={() => router.push("/calendar")}
            className="min-h-11 flex-1 items-center justify-center rounded-full bg-surface-light px-2 dark:bg-surface-dark"
          >
            <Text className="text-center text-[11px] font-semibold text-ink-light dark:text-ink-dark">
              Calendrier
            </Text>
          </Pressable>
        </View>

        <View className="mt-6">
          <Text className="mb-3 text-[17px] font-bold text-ink-light dark:text-ink-dark">
            Macros du jour
          </Text>
          <View className="flex-row gap-2">
            <MacroValue label="Protéines" value={macros.proteines} />
            <MacroValue label="Glucides" value={macros.glucides} />
            <MacroValue label="Lipides" value={macros.lipides} />
          </View>
          {macros.proteines === null &&
          macros.glucides === null &&
          macros.lipides === null ? (
            <Text className="mt-2 text-[11px] text-muted-light dark:text-muted-dark">
              Les macros s’affichent lorsqu’elles sont disponibles pour un
              repas.
            </Text>
          ) : null}
        </View>

        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
              {translateTip("tips.ui.day", settings.language)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translateTip(
                "tips.ui.seeAll",
                settings.language,
              )}
              onPress={() => router.push("/stats")}
              className="min-h-11 justify-center px-2"
            >
              <Text className="text-[12px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                {translateTip("tips.ui.seeAll", settings.language)}
              </Text>
            </Pressable>
          </View>
          {tipsError ? (
            <View>
              <Text
                accessibilityRole="alert"
                className="mb-2 text-[12px] text-[#A53F35]"
              >
                {translateTip("tips.ui.error", settings.language)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={translateTip(
                  "tips.ui.retry",
                  settings.language,
                )}
                onPress={() => void refreshTips().catch(() => undefined)}
                className="min-h-11 justify-center"
              >
                <Text className="text-[12px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                  {translateTip("tips.ui.retry", settings.language)}
                </Text>
              </Pressable>
            </View>
          ) : tips.length ? (
            <TipsCard
              tip={tips[0]}
              onDismiss={(ruleId) =>
                void dismissTip(ruleId).catch(() => undefined)
              }
            />
          ) : (
            <TipsEmptyState
              message={translateTip(
                stats && stats.current.trackedDays < 3
                  ? "tips.ui.insufficient"
                  : "tips.ui.empty",
                settings.language,
              )}
            />
          )}
        </View>

        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[17px] font-bold text-ink-light dark:text-ink-dark">
              Repas d’aujourd’hui
            </Text>
            <Text className="text-[12px] font-semibold text-muted-light dark:text-muted-dark">
              {entries.length}
            </Text>
          </View>
          {error ? (
            <Text
              accessibilityRole="alert"
              className="mb-3 text-[12px] text-[#A53F35]"
            >
              {error}
            </Text>
          ) : null}
          {isLoading ? (
            <ActivityIndicator color="#245C45" />
          ) : entries.length ? (
            <View className="gap-2">
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
            <View className="items-center rounded-[22px] border border-dashed border-brand-border bg-surface-light px-5 py-6 dark:border-selected-dark dark:bg-surface-dark">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-secondary dark:bg-selected-dark">
                <Text className="text-[26px] text-brand-primary dark:text-[#A8C8B2]">
                  ⌕
                </Text>
              </View>
              <Text className="mt-3 text-[16px] font-bold text-ink-light dark:text-ink-dark">
                Scanne ton premier repas
              </Text>
              <Text className="mt-1 text-center text-[12px] text-muted-light dark:text-muted-dark">
                Une photo suffit pour commencer ton journal.
              </Text>
            </View>
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
                className="mt-3 text-xs text-[#A53F35]"
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
                className="min-h-11 flex-1 items-center justify-center rounded-[15px] bg-[#A53F35]"
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

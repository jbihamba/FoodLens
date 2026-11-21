import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/food/BrandMark";
import { FoodButton } from "@/components/food/FoodButton";
import { Pressable, Text, TextInput } from "@/components/LocalizedText";
import { DEFAULT_DAILY_GOAL, MAX_DAILY_GOAL } from "@/services/calorieTracking";
import { useDailyCalories } from "@/stores/daily-calories";

export default function GoalScreen() {
  const { goal, setGoal, isLoading } = useDailyCalories();
  const [calories, setCalories] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const calorieInput =
    calories ?? String(goal?.target_calories ?? DEFAULT_DAILY_GOAL);

  const save = async () => {
    if (!/^\d+$/.test(calorieInput.trim())) {
      setError("Enter a whole number of calories.");
      return;
    }
    const target = Number(calorieInput);
    if (target < 1 || target > MAX_DAILY_GOAL) {
      setError(
        `Choose a goal between 1 and ${MAX_DAILY_GOAL.toLocaleString()} kcal.`,
      );
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await setGoal(target);
      router.back();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save your goal.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="mx-auto w-full max-w-[560px] flex-grow px-6 pb-9"
          keyboardShouldPersistTaps="handled"
        >
          <View className="min-h-[58px] flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel editing daily goal"
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center"
            >
              <Text className="-mt-1 text-[37px] leading-10 text-ink-light dark:text-ink-dark">
                ‹
              </Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              <BrandMark size={34} />
              <Text className="text-base font-bold text-ink-light dark:text-ink-dark">
                Daily goal
              </Text>
            </View>
            <View className="w-10" />
          </View>

          <View className="pt-[37px]">
            <Text className="text-[10px] font-bold tracking-[1.3px] text-brand-primary">
              YOUR DAILY TARGET
            </Text>
            <Text className="mt-3 text-[31px] font-bold leading-[38px] tracking-[-0.8px] text-ink-light dark:text-ink-dark">
              Set a goal that{"\n"}works for you.
            </Text>
            <Text className="mt-2 text-sm leading-[21px] text-muted-light dark:text-muted-dark">
              Choose your target calories for each day. You can update it
              whenever you like.
            </Text>

            {/* Bouton vers le calculateur automatique */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Calculer mon objectif avec la formule Mifflin-St Jeor"
              onPress={() => router.push("/calorie-goal-wizard")}
              className="mt-5 min-h-[52px] flex-row items-center justify-between rounded-[16px] border border-brand-border dark:border-selected-dark bg-[#EDF5F0] dark:bg-[#1E3328] px-4 py-3"
            >
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-[#245C45] dark:text-[#A8C8B2]">
                  Calculer avec ma morphologie ✦
                </Text>
                <Text className="text-[11px] text-[#245C45] dark:text-[#A8C8B2] mt-[2px] leading-4 opacity-80">
                  Formule Mifflin-St Jeor · 2 min
                </Text>
              </View>
              <Text
                aria-hidden
                className="text-[#245C45] dark:text-[#A8C8B2] text-lg"
              >
                ›
              </Text>
            </Pressable>

            <View className="mt-5 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[18px] dark:border-selected-dark dark:bg-surface-dark">
              <Text className="text-xs font-bold text-ink-light dark:text-ink-dark">
                Daily calorie goal
              </Text>
              <View className="mt-3 flex-row items-center rounded-[14px] border border-brand-border px-[14px] dark:border-selected-dark">
                <TextInput
                  accessibilityLabel="Daily calorie goal in kilocalories"
                  className="h-[54px] flex-1 text-[20px] font-bold text-ink-light dark:text-ink-dark"
                  value={calorieInput}
                  onChangeText={setCalories}
                  keyboardType="number-pad"
                  placeholder="2000"
                  placeholderTextColor="#68736B"
                  editable={!isLoading && !isSaving}
                  returnKeyType="done"
                  onSubmitEditing={() => void save()}
                />
                <Text className="text-sm font-semibold text-muted-light dark:text-muted-dark">
                  kcal
                </Text>
              </View>
              <Text className="mt-2 text-[11px] leading-4 text-muted-light dark:text-muted-dark">
                Enter a whole number from 1 to {MAX_DAILY_GOAL.toLocaleString()}{" "}
                kcal.
              </Text>
            </View>

            {error ? (
              <Text
                accessibilityRole="alert"
                className="mt-3 text-xs leading-[18px] text-[#A53F35]"
              >
                {error}
              </Text>
            ) : null}

            <View className="mt-5 gap-[10px]">
              <FoodButton
                label={isSaving ? "Saving goal…" : "Save goal"}
                trailing={isSaving ? undefined : "→"}
                disabled={isLoading || isSaving}
                onPress={() => void save()}
              />
              <FoodButton
                label="Cancel"
                variant="outline"
                disabled={isSaving}
                onPress={() => router.back()}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

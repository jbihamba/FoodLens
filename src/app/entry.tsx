import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import Animated, { FadeInDown } from "react-native-reanimated";

import { BrandMark } from "@/components/food/BrandMark";
import { FoodButton } from "@/components/food/FoodButton";
import { Pressable, Text, TextInput } from "@/components/LocalizedText";
import { StyledImage } from "@/components/nativewind-interop";
import { getFoodEntry, type FoodEntry } from "@/services/calorieTracking";
import { useDailyCalories } from "@/stores/daily-calories";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

function parseOptionalNutrition(value: string, label: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number of grams.`);
  }
  return parsed;
}

export default function EntryScreen() {
  const { id: routeId } = useLocalSearchParams<{ id?: string }>();
  const db = useSQLiteContext();
  const { addEntry, updateEntry, deleteEntry } = useDailyCalories();
  const isCreating = routeId === undefined;
  const entryId = Number(routeId);
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [mealType, setMealType] = useState<string | null>(null);
  const [protein, setProtein] = useState("");
  const [carbohydrates, setCarbohydrates] = useState("");
  const [fat, setFat] = useState("");
  const [isLoading, setIsLoading] = useState(!isCreating);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isCurrent = true;
    if (isCreating) {
      return;
    }

    const loadEntry = async () => {
      try {
        if (!Number.isInteger(entryId) || entryId < 1) {
          throw new Error("This meal could not be found.");
        }
        const result = await getFoodEntry(db, entryId);
        if (isCurrent && result) {
          setEntry(result);
          setFoodName(result.food_name);
          setCalories(String(result.calories));
          setMealType(result.meal_type);
          setProtein(result.protein_g === null ? "" : String(result.protein_g));
          setCarbohydrates(
            result.carbs_g === null ? "" : String(result.carbs_g),
          );
          setFat(result.fat_g === null ? "" : String(result.fat_g));
        } else if (isCurrent) {
          setError("This meal could not be found.");
        }
      } catch (cause) {
        if (isCurrent) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load this meal.",
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void loadEntry();
    return () => {
      isCurrent = false;
    };
  }, [db, entryId, isCreating]);

  useEffect(
    () => () => {
      if (returnTimer.current) {
        clearTimeout(returnTimer.current);
      }
    },
    [],
  );

  const returnToDiary = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const save = async () => {
    const calorieValue = Number(calories);
    if (!foodName.trim()) {
      setError("Enter a name for this meal.");
      return;
    }
    if (!Number.isFinite(calorieValue) || calorieValue <= 0) {
      setError("Calories must be a positive number.");
      return;
    }
    if (!mealType?.trim()) {
      setError("Choose a meal category.");
      return;
    }

    let proteinValue: number | null;
    let carbohydrateValue: number | null;
    let fatValue: number | null;
    try {
      proteinValue = parseOptionalNutrition(protein, "Protein");
      carbohydrateValue = parseOptionalNutrition(
        carbohydrates,
        "Carbohydrates",
      );
      fatValue = parseOptionalNutrition(fat, "Fat");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Check the nutrition values.",
      );
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const meal = {
        foodName: foodName.trim(),
        calories: calorieValue,
        mealType,
        imageUri: entry?.image_uri ?? null,
        proteinG: proteinValue,
        carbsG: carbohydrateValue,
        fatG: fatValue,
      };
      if (isCreating) {
        await addEntry(meal);
      } else {
        await updateEntry(entryId, meal);
      }
      setToast(isCreating ? "Meal added to your diary" : "Meal changes saved");
      returnTimer.current = setTimeout(returnToDiary, 850);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save this meal.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (isCreating || !entry || isSaving) {
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await deleteEntry(entry.id);
      setDeleteConfirmationVisible(false);
      setToast("Meal deleted from your diary");
      returnTimer.current = setTimeout(returnToDiary, 850);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete this meal.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const legacyMealType =
    entry?.meal_type && !MEAL_TYPES.some((type) => type === entry.meal_type)
      ? entry.meal_type
      : null;

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="mx-auto w-full max-w-[560px] flex-grow px-5 pb-9 sm:px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="min-h-[58px] flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to today's diary"
              onPress={returnToDiary}
              className="h-10 w-10 items-center justify-center"
            >
              <Text className="-mt-1 text-[37px] leading-10 text-ink-light dark:text-ink-dark">
                ‹
              </Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              <BrandMark size={34} />
              <Text className="text-base font-bold text-ink-light dark:text-ink-dark">
                {isCreating ? "New meal" : "Edit meal"}
              </Text>
            </View>
            <View className="w-10" />
          </View>

          {!isCreating && isLoading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator size="large" color="#245C45" />
              <Text className="mt-3 text-sm text-muted-light dark:text-muted-dark">
                Loading meal…
              </Text>
            </View>
          ) : entry || isCreating ? (
            <View className="pt-[30px]">
              <Text className="text-[10px] font-bold tracking-[1.3px] text-brand-primary">
                TODAY&apos;S FOOD DIARY
              </Text>
              <Text className="mt-3 text-[30px] font-bold leading-[36px] tracking-[-0.8px] text-ink-light dark:text-ink-dark">
                {isCreating ? "Add a meal" : "Update your meal"}
              </Text>
              <Text className="mt-2 text-[13px] leading-5 text-muted-light dark:text-muted-dark">
                Save it locally and keep your daily calorie totals up to date.
              </Text>

              {entry?.image_uri ? (
                <View className="mt-5 h-[175px] overflow-hidden rounded-[21px] bg-selected-light dark:bg-selected-dark">
                  <StyledImage
                    source={{ uri: entry.image_uri }}
                    contentFit="cover"
                    className="h-full w-full"
                  />
                </View>
              ) : null}

              <View className="mt-5 gap-[17px] rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <View>
                  <Text className="text-xs font-bold text-ink-light dark:text-ink-dark">
                    Food name
                  </Text>
                  <TextInput
                    accessibilityLabel="Food name"
                    className="mt-2 h-[50px] rounded-[14px] border border-brand-border px-[13px] text-[15px] text-ink-light dark:border-selected-dark dark:text-ink-dark"
                    value={foodName}
                    onChangeText={setFoodName}
                    editable={!isSaving}
                    maxLength={100}
                    returnKeyType="next"
                    placeholder="e.g. Avocado toast"
                    placeholderTextColor="#68736B"
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-ink-light dark:text-ink-dark">
                    Calories
                  </Text>
                  <View className="mt-2 flex-row items-center rounded-[14px] border border-brand-border px-[13px] dark:border-selected-dark">
                    <TextInput
                      accessibilityLabel="Calories in kilocalories"
                      className="h-[50px] flex-1 text-[15px] text-ink-light dark:text-ink-dark"
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="decimal-pad"
                      editable={!isSaving}
                      placeholder="e.g. 350"
                      placeholderTextColor="#68736B"
                    />
                    <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">
                      kcal
                    </Text>
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-bold text-ink-light dark:text-ink-dark">
                    Meal category
                  </Text>
                  <View className="mt-[10px] flex-row flex-wrap gap-2">
                    {MEAL_TYPES.map((type) => {
                      const selected = mealType === type;
                      return (
                        <Pressable
                          key={type}
                          accessibilityRole="button"
                          accessibilityState={{ selected, disabled: isSaving }}
                          disabled={isSaving}
                          onPress={() => setMealType(type)}
                          className={`min-h-[40px] items-center justify-center rounded-full border px-[14px] ${
                            selected
                              ? "border-brand-primary bg-brand-primary"
                              : "border-brand-border bg-canvas-light dark:border-selected-dark dark:bg-canvas-dark"
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              selected
                                ? "text-white"
                                : "text-muted-light dark:text-muted-dark"
                            }`}
                          >
                            {type === "Snack" ? "Snacks" : type}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {legacyMealType ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: mealType === legacyMealType,
                          disabled: isSaving,
                        }}
                        disabled={isSaving}
                        onPress={() => setMealType(legacyMealType)}
                        className={`min-h-[40px] items-center justify-center rounded-full border px-[14px] ${
                          mealType === legacyMealType
                            ? "border-brand-primary bg-brand-primary"
                            : "border-brand-border bg-canvas-light dark:border-selected-dark dark:bg-canvas-dark"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            mealType === legacyMealType
                              ? "text-white"
                              : "text-muted-light dark:text-muted-dark"
                          }`}
                        >
                          Keep “{legacyMealType}”
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>

              <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
                  Nutrition details
                </Text>
                <Text className="mt-1 text-[11px] leading-[16px] text-muted-light dark:text-muted-dark">
                  Optional — leave blank if you don&apos;t know these values.
                </Text>
                <View className="mt-3 flex-row gap-2">
                  {[
                    { label: "Protein", value: protein, setter: setProtein },
                    {
                      label: "Carbs",
                      value: carbohydrates,
                      setter: setCarbohydrates,
                    },
                    { label: "Fat", value: fat, setter: setFat },
                  ].map((field) => (
                    <View key={field.label} className="flex-1">
                      <Text className="text-[10px] font-semibold text-muted-light dark:text-muted-dark">
                        {field.label} · g
                      </Text>
                      <TextInput
                        accessibilityLabel={`${field.label} in grams`}
                        className="mt-[6px] h-[45px] rounded-[12px] border border-brand-border px-[10px] text-sm text-ink-light dark:border-selected-dark dark:text-ink-dark"
                        value={field.value}
                        onChangeText={field.setter}
                        keyboardType="decimal-pad"
                        editable={!isSaving}
                        placeholder="—"
                        placeholderTextColor="#68736B"
                      />
                    </View>
                  ))}
                </View>
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
                  label={
                    isSaving
                      ? "Saving…"
                      : isCreating
                        ? "Add to diary"
                        : "Save changes"
                  }
                  trailing={isSaving ? undefined : "→"}
                  disabled={isSaving}
                  onPress={() => void save()}
                />
                {!isCreating ? (
                  <FoodButton
                    label="Delete meal"
                    variant="outline"
                    disabled={isSaving}
                    onPress={() => setDeleteConfirmationVisible(true)}
                  />
                ) : null}
                <FoodButton
                  label="Cancel"
                  variant="outline"
                  disabled={isSaving}
                  onPress={returnToDiary}
                />
              </View>
            </View>
          ) : error ? (
            <Text
              accessibilityRole="alert"
              className="pt-8 text-sm text-[#A53F35]"
            >
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="fade"
        visible={isDeleteConfirmationVisible}
        onRequestClose={() => {
          if (!isSaving) {
            setDeleteConfirmationVisible(false);
          }
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full max-w-[390px] rounded-[24px] bg-surface-light p-5 dark:bg-surface-dark">
            <Text className="text-[19px] font-bold text-ink-light dark:text-ink-dark">
              Delete this meal?
            </Text>
            <Text className="mt-2 text-[13px] leading-5 text-muted-light dark:text-muted-dark">
              This removes it from your diary and updates today&apos;s calorie
              total.
            </Text>
            <View className="mt-5 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => setDeleteConfirmationVisible(false)}
                className="min-h-[48px] flex-1 items-center justify-center rounded-[15px] bg-canvas-light dark:bg-canvas-dark"
              >
                <Text className="text-sm font-bold text-ink-light dark:text-ink-dark">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => void remove()}
                className="min-h-[48px] flex-1 items-center justify-center rounded-[15px] bg-[#A53F35] disabled:opacity-60"
              >
                <Text className="text-sm font-bold text-white">
                  {isSaving ? "Deleting…" : "Delete meal"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {toast ? (
        <Animated.View
          entering={FadeInDown.duration(180)}
          accessibilityRole="alert"
          className="absolute bottom-5 left-5 right-5 self-center rounded-[16px] bg-[#202820] px-4 py-[13px]"
        >
          <Text className="text-center text-[12px] font-semibold text-white">
            {toast}
          </Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

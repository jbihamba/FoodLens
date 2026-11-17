import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

import { BrandMark } from '@/components/food/BrandMark';
import { CalorieProgressBar } from '@/components/food/CalorieProgressBar';
import { FoodButton } from '@/components/food/FoodButton';
import { StyledImage } from '@/components/nativewind-interop';
import { useDailyCalories } from '@/stores/daily-calories';
import { useScanSession } from '@/stores/scan-session';
import type { ScanSession } from '@/types/food';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
type MealType = (typeof MEAL_TYPES)[number];

function getPortionLabel(portionSize: string | null, multiplier: number) {
  if (!portionSize) {
    return `${multiplier}× estimated portion`;
  }

  const quantity = portionSize.match(/(\d+(?:\.\d+)?)\s*(g|grams?|ml|milliliters?|oz|ounces?)\b/i);
  if (quantity) {
    const scaledQuantity = Number(quantity[1]) * multiplier;
    const formattedQuantity = Number.isInteger(scaledQuantity)
      ? String(scaledQuantity)
      : scaledQuantity.toFixed(1);
    return portionSize.replace(quantity[0], `${formattedQuantity} ${quantity[2]}`);
  }

  return multiplier === 1 ? portionSize : `${multiplier}× ${portionSize}`;
}

function NutritionCard({
  label,
  value,
  unit,
  unavailable = false,
}: {
  label: string;
  value: string;
  unit: string;
  unavailable?: boolean;
}) {
  return (
    <View className="min-h-[105px] flex-1 rounded-[17px] bg-canvas-light p-[13px] dark:bg-canvas-dark">
      <View className="h-[4px] w-8 rounded-full bg-brand-primary dark:bg-[#A8C8B2]" />
      <Text className="mt-[11px] text-[10px] font-bold tracking-[0.8px] text-muted-light dark:text-muted-dark">
        {label}
      </Text>
      <View className="mt-[3px] flex-row items-baseline gap-1">
        <Text
          className={`text-[21px] font-bold tracking-[-0.5px] ${
            unavailable
              ? 'text-muted-light dark:text-muted-dark'
              : 'text-ink-light dark:text-ink-dark'
          }`}>
          {value}
        </Text>
        <Text className="text-[10px] font-semibold text-muted-light dark:text-muted-dark">
          {unit}
        </Text>
      </View>
      {unavailable ? (
        <Text className="mt-1 text-[9px] leading-3 text-muted-light dark:text-muted-dark">
          Not estimated
        </Text>
      ) : null}
    </View>
  );
}

export default function ResultScreen() {
  const { scan } = useScanSession();
  return <ResultContent key={scan?.imageUri ?? 'empty'} scan={scan} />;
}

function ResultContent({ scan }: { scan: ScanSession | null }) {
  const { addEntry, goal, entries, isLoading: isDiaryLoading, error: diaryError } = useDailyCalories();
  const [foodName, setFoodName] = useState(scan?.analysis.foodName ?? '');
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [isLogging, setIsLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const submissionLock = useRef(false);

  const back = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const changePhoto = (source: 'camera' | 'gallery') => {
    router.push(
      source === 'gallery'
        ? { pathname: '/scanner', params: { source: 'gallery' } }
        : '/scanner',
    );
  };

  const baseCalories = scan?.analysis.estimatedCalories ?? null;
  const calories = baseCalories === null ? null : Math.round(baseCalories * portionMultiplier);
  const consumed = entries.reduce((total, entry) => total + entry.calories, 0);
  const dailyGoal = goal?.target_calories ?? null;
  const projectedCalories =
    calories === null ? consumed : consumed + (logged ? 0 : calories);
  const remainingAfterMeal =
    dailyGoal === null ? null : Math.max(dailyGoal - projectedCalories, 0);

  const logMeal = async () => {
    if (
      !scan ||
      calories === null ||
      calories <= 0 ||
      !foodName.trim() ||
      !mealType ||
      logged ||
      submissionLock.current
    ) {
      return;
    }

    submissionLock.current = true;
    setLogError(null);
    setIsLogging(true);
    try {
      await addEntry({
        foodName: foodName.trim(),
        calories,
        mealType,
        imageUri: scan.imageUri,
      });
      setLogged(true);
    } catch (cause) {
      setLogError(cause instanceof Error ? cause.message : 'Could not add this meal to your diary.');
    } finally {
      submissionLock.current = false;
      setIsLogging(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="mx-auto w-full max-w-[560px] flex-grow px-5 pb-8 sm:px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="min-h-[58px] flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={back}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
              <Text className="text-[27px] leading-8 text-ink-light dark:text-ink-dark">‹</Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              <BrandMark size={28} />
              <Text className="text-base font-bold text-ink-light dark:text-ink-dark">
                FoodLens
              </Text>
            </View>
            <View className="w-11" />
          </View>

          {!scan ? (
            <Animated.View
              entering={FadeIn.duration(260)}
              className="flex-1 items-center justify-center py-16">
              <View className="h-[68px] w-[68px] items-center justify-center rounded-[23px] bg-brand-secondary dark:bg-selected-dark">
                <Text className="text-[30px] text-brand-primary">⌕</Text>
              </View>
              <Text className="mt-5 text-center text-[26px] font-bold tracking-[-0.6px] text-ink-light dark:text-ink-dark">
                No scan to review
              </Text>
              <Text className="mt-2 max-w-[280px] text-center text-sm leading-[21px] text-muted-light dark:text-muted-dark">
                Take or choose a food photo to get an estimate.
              </Text>
              <FoodButton
                label="Scan a meal"
                trailing="→"
                className="mt-6 self-stretch"
                onPress={() => router.replace('/scanner')}
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(280)} layout={Layout.springify()}>
              <View className="pb-[15px] pt-5">
                <Text className="text-[10px] font-bold tracking-[1.4px] text-brand-primary">
                  YOUR FOOD ANALYSIS
                </Text>
                <Text className="mt-[7px] text-[28px] font-bold leading-[34px] tracking-[-0.8px] text-ink-light dark:text-ink-dark">
                  Make it yours.
                </Text>
              </View>

              <View className="h-[218px] overflow-hidden rounded-[24px] bg-[#18251E]">
                <StyledImage
                  source={{ uri: scan.imageUri }}
                  contentFit="cover"
                  className="h-full w-full"
                />
                <View className="absolute left-3 top-3 flex-row items-center gap-[6px] rounded-full bg-[#202820CC] px-[11px] py-[7px]">
                  <View className="h-[6px] w-[6px] rounded-full bg-[#A8C8B2]" />
                  <Text className="text-[9px] font-bold tracking-[0.8px] text-white">
                    ESTIMATE · NOT VERIFIED
                  </Text>
                </View>
                <View className="absolute bottom-3 right-3 flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retake food photo"
                    disabled={isLogging || logged}
                    onPress={() => changePhoto('camera')}
                    className="min-h-10 flex-row items-center justify-center rounded-full bg-[#202820CC] px-4 disabled:opacity-50">
                    <Text className="text-xs font-bold text-white">Retake</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose a different food photo"
                    disabled={isLogging || logged}
                    onPress={() => changePhoto('gallery')}
                    className="min-h-10 flex-row items-center justify-center rounded-full bg-white px-4 disabled:opacity-50">
                    <Text className="text-xs font-bold text-brand-primary">Change</Text>
                  </Pressable>
                </View>
              </View>

              {scan.analysis.description || scan.analysis.ingredients.length > 0 ? (
                <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                  <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                    WHAT WE SEE
                  </Text>
                  {scan.analysis.description ? (
                    <Text className="mt-2 text-[13px] leading-[19px] text-ink-light dark:text-ink-dark">
                      {scan.analysis.description}
                    </Text>
                  ) : null}
                  {scan.analysis.ingredients.length > 0 ? (
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {scan.analysis.ingredients.map((ingredient) => (
                        <View
                          key={ingredient}
                          className="rounded-full bg-brand-secondary px-3 py-[7px] dark:bg-selected-dark">
                          <Text className="text-[10px] font-semibold text-brand-primary dark:text-[#A8C8B2]">
                            {ingredient}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                    DETECTED FOOD
                  </Text>
                  <Text className="text-[10px] font-semibold text-brand-primary dark:text-[#A8C8B2]">
                    EDITABLE
                  </Text>
                </View>
                <TextInput
                  accessibilityLabel="Edit detected food name"
                  value={foodName}
                  onChangeText={setFoodName}
                  editable={!logged && !isLogging}
                  maxLength={100}
                  returnKeyType="done"
                  placeholder="Food name"
                  placeholderTextColor="#68736B"
                  className="mt-1 h-[46px] border-b border-brand-border text-[20px] font-bold tracking-[-0.4px] text-ink-light dark:border-selected-dark dark:text-ink-dark"
                />
                {scan.analysis.confidence !== null ? (
                  <Text className="mt-[9px] text-[11px] text-muted-light dark:text-muted-dark">
                    Visual match · {Math.round(scan.analysis.confidence * 100)}% confidence
                  </Text>
                ) : null}
              </View>

              <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                      NUTRITION BREAKDOWN
                    </Text>
                    <Text className="mt-[3px] text-[11px] text-muted-light dark:text-muted-dark">
                      Estimated for selected portion
                    </Text>
                  </View>
                  <View className="rounded-full bg-brand-secondary px-[10px] py-[6px] dark:bg-selected-dark">
                    <Text className="text-[9px] font-bold tracking-[0.5px] text-brand-primary dark:text-[#A8C8B2]">
                      ESTIMATED
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row items-center justify-between rounded-[17px] bg-canvas-light px-[14px] py-[13px] dark:bg-canvas-dark">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-brand-secondary dark:bg-selected-dark">
                      <Text className="text-[12px] font-extrabold text-brand-primary dark:text-[#A8C8B2]">
                        kcal
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">
                        Calories
                      </Text>
                      <Text className="mt-[2px] text-[10px] text-muted-light dark:text-muted-dark">
                        {calories === null ? 'No visual estimate available' : 'Approximate energy'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[30px] font-bold leading-9 tracking-[-1px] text-ink-light dark:text-ink-dark">
                    {calories === null ? '—' : calories.toLocaleString()}
                  </Text>
                </View>

                <View className="mt-3 flex-row gap-2">
                  <NutritionCard label="PROTEIN" value="—" unit="g" unavailable />
                  <NutritionCard label="CARBS" value="—" unit="g" unavailable />
                  <NutritionCard label="FATS" value="—" unit="g" unavailable />
                </View>
                <Text className="mt-3 text-[10px] leading-[15px] text-muted-light dark:text-muted-dark">
                  Macronutrients aren&apos;t included in this scan result, so FoodLens won&apos;t guess them.
                </Text>
              </View>

              <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                      ADJUST PORTION
                    </Text>
                    <Text
                      numberOfLines={2}
                      className="mt-[4px] text-[13px] font-semibold leading-[18px] text-ink-light dark:text-ink-dark">
                      {getPortionLabel(scan.analysis.portionSize, portionMultiplier)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Decrease portion"
                      accessibilityState={{ disabled: logged || portionMultiplier <= 0.5 }}
                      disabled={logged || portionMultiplier <= 0.5}
                      onPress={() => setPortionMultiplier((value) => Math.max(0.5, value - 0.5))}
                      className="h-10 w-10 items-center justify-center rounded-full bg-canvas-light disabled:opacity-40 dark:bg-canvas-dark">
                      <Text className="text-xl font-semibold text-ink-light dark:text-ink-dark">−</Text>
                    </Pressable>
                    <Text className="min-w-[39px] text-center text-sm font-bold text-ink-light dark:text-ink-dark">
                      {portionMultiplier}×
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Increase portion"
                      accessibilityState={{ disabled: logged || portionMultiplier >= 10 }}
                      disabled={logged || portionMultiplier >= 10}
                      onPress={() => setPortionMultiplier((value) => Math.min(10, value + 0.5))}
                      className="h-10 w-10 items-center justify-center rounded-full bg-brand-secondary disabled:opacity-40 dark:bg-selected-dark">
                      <Text className="text-xl font-semibold text-brand-primary dark:text-[#A8C8B2]">+</Text>
                    </Pressable>
                  </View>
                </View>
                <Text className="mt-[10px] text-[10px] leading-[15px] text-muted-light dark:text-muted-dark">
                  Calories scale proportionally from the original estimate. Portion size is approximate.
                </Text>
              </View>

              <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                  ADD TO DIARY
                </Text>
                <Text className="mt-[5px] text-[17px] font-bold text-ink-light dark:text-ink-dark">
                  Choose a meal
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {MEAL_TYPES.map((type) => {
                    const selected = mealType === type;
                    return (
                      <Pressable
                        key={type}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled: logged }}
                        disabled={logged}
                        onPress={() => setMealType(type)}
                        className={`min-h-[40px] items-center justify-center rounded-full border px-[14px] ${
                          selected
                            ? 'border-brand-primary bg-brand-primary'
                            : 'border-brand-border bg-canvas-light dark:border-selected-dark dark:bg-canvas-dark'
                        } disabled:opacity-55`}>
                        <Text
                          className={`text-xs font-bold ${
                            selected
                              ? 'text-white'
                              : 'text-muted-light dark:text-muted-dark'
                          }`}>
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {isDiaryLoading ? (
                  <View className="mt-4 flex-row items-center">
                    <ActivityIndicator size="small" color="#245C45" />
                    <Text className="ml-2 text-[11px] text-muted-light dark:text-muted-dark">
                      Loading today&apos;s diary…
                    </Text>
                  </View>
                ) : dailyGoal !== null && calories !== null ? (
                  <View className="mt-4 border-t border-brand-border pt-3 dark:border-selected-dark">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[10px] font-bold tracking-[0.7px] text-muted-light dark:text-muted-dark">
                        TODAY&apos;S GOAL · AFTER ADDING
                      </Text>
                      <Text className="text-[11px] font-bold text-ink-light dark:text-ink-dark">
                        {projectedCalories.toLocaleString()} / {dailyGoal.toLocaleString()} kcal
                      </Text>
                    </View>
                    <View className="mt-2">
                      <CalorieProgressBar
                        progress={(projectedCalories / dailyGoal) * 100}
                        isGoalReached={projectedCalories >= dailyGoal}
                      />
                    </View>
                    <Text className="mt-2 text-[10px] text-muted-light dark:text-muted-dark">
                      {remainingAfterMeal === 0
                        ? 'Daily goal would be reached or exceeded.'
                        : `${remainingAfterMeal?.toLocaleString()} kcal remaining after adding.`}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="mt-4 flex-row items-start gap-[10px] rounded-[15px] bg-[#F4EBDD] p-[13px] dark:bg-[#393127]">
                <Text className="h-[19px] w-[19px] overflow-hidden rounded-full bg-[#E9D1AF] text-center text-xs font-bold leading-[19px] text-[#78572F]">
                  i
                </Text>
                <Text className="flex-1 text-[10px] leading-[15px] text-[#705C42] dark:text-[#E2D3BA]">
                  This is a visual estimate, not verified nutrition data. Actual values vary with ingredients, preparation, and serving size.
                </Text>
              </View>

              {diaryError ? (
                <Text accessibilityRole="alert" className="mt-3 text-[11px] leading-[17px] text-[#A53F35]">
                  Today&apos;s diary could not be refreshed: {diaryError}
                </Text>
              ) : null}
              {logError ? (
                <Text accessibilityRole="alert" className="mt-3 text-[11px] leading-[17px] text-[#A53F35]">
                  {logError}
                </Text>
              ) : null}

              <View className="mt-5 gap-[10px]">
                <FoodButton
                  label={
                    logged
                      ? 'Added to your diary'
                      : isLogging
                        ? 'Adding to diary…'
                        : 'Add to Diary'
                  }
                  hint={
                    logged
                      ? `${calories?.toLocaleString()} kcal · ${mealType}`
                      : !mealType
                        ? 'Choose breakfast, lunch, dinner, or snack'
                        : calories === null || calories <= 0
                          ? 'A positive calorie estimate is required'
                          : 'Save this estimate to today’s food log'
                  }
                  variant={logged ? 'secondary' : 'primary'}
                  trailing={logged || isLogging ? undefined : '＋'}
                  disabled={
                    logged ||
                    isLogging ||
                    !mealType ||
                    !foodName.trim() ||
                    calories === null ||
                    calories <= 0
                  }
                  onPress={() => void logMeal()}
                />
                <FoodButton
                  label="Scan another meal"
                  variant="outline"
                  trailing="→"
                  disabled={isLogging}
                  onPress={() => router.replace('/scanner')}
                />
              </View>

              <View className="mt-7 flex-row items-center justify-center gap-[9px] border-t-[0.5px] border-brand-border pt-[17px]">
                <BrandMark size={26} />
                <Text className="text-[10px] text-muted-light dark:text-muted-dark">
                  A helpful estimate, never a diagnosis.
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

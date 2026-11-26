import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  Layout,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { BrandMark } from "@/components/food/BrandMark";
import { CalorieProgressBar } from "@/components/food/CalorieProgressBar";
import { FoodButton } from "@/components/food/FoodButton";
import { Pressable, Text, TextInput } from "@/components/LocalizedText";
import { StyledImage } from "@/components/nativewind-interop";
import { ScanResultSheet } from "@/components/scan/ScanResultSheet";
import { useScanResult } from "@/hooks/useScanResult";
import { useAppSettings } from "@/stores/app-settings";
import { useDailyCalories } from "@/stores/daily-calories";
import { useScanSession } from "@/stores/scan-session";
import type { FoodAnalysis, ScanSession } from "@/types/food";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  Breakfast: "Petit-déjeuner",
  Lunch: "Déjeuner",
  Dinner: "Dîner",
  Snack: "Collation",
};

function getPortionGrams(portionSize: string | null) {
  if (!portionSize) {
    return null;
  }

  const quantity = portionSize.match(
    /(\d+(?:[.,]\d+)?)\s*(kilograms?|kg|grams?|g|pounds?|lbs?|ounces?|oz)\b/i,
  );
  if (!quantity) {
    return null;
  }

  const amount = Number(quantity[1].replace(",", "."));
  const unit = quantity[2].toLowerCase();
  const grams = /^(kg|kilograms?)$/.test(unit)
    ? amount * 1000
    : /^(lb|lbs|pound|pounds)$/.test(unit)
      ? amount * 453.59237
      : /^(oz|ounce|ounces)$/.test(unit)
        ? amount * 28.3495
        : amount;

  return Number.isFinite(grams) && grams > 0 ? grams : null;
}

function formatGrams(grams: number) {
  return `${Number.isInteger(grams) ? grams : Number(grams.toFixed(1))} g`;
}

function getPortionLabel(
  portionSize: string | null,
  multiplier: number,
  units: "metric" | "imperial",
) {
  if (!portionSize) {
    return `${multiplier}× portion estimée`;
  }

  const quantity = portionSize.match(
    /(\d+(?:\.\d+)?)\s*(kilograms?|kg|grams?|g|pounds?|lbs?|ounces?|oz|milliliters?|ml|liters?|litres?|l|fluid ounces?|fl oz|cups?)\b/i,
  );
  if (quantity) {
    const sourceAmount = Number(quantity[1]) * multiplier;
    const sourceUnit = quantity[2].toLowerCase();
    const isMetricMass = /^(kg|kilograms?|g|grams?)$/.test(sourceUnit);
    const isImperialMass = /^(oz|ounces?|lbs?|pounds?)$/.test(sourceUnit);
    const isMetricVolume = /^(ml|milliliters?|l|liters?|litres?)$/.test(
      sourceUnit,
    );
    const isImperialVolume = /^(fl oz|fluid ounces?)$/.test(sourceUnit);
    let amount = sourceAmount;
    let unit = quantity[2];

    if (units === "imperial" && isMetricMass) {
      const grams =
        sourceAmount * (/^(kg|kilograms?)$/.test(sourceUnit) ? 1000 : 1);
      amount = grams / 28.3495;
      unit = "oz";
      if (amount >= 16) {
        amount /= 16;
        unit = "lb";
      }
    } else if (
      units === "imperial" &&
      (isMetricVolume || /^cups?$/.test(sourceUnit))
    ) {
      const milliliters =
        sourceAmount *
        (/^cups?$/.test(sourceUnit)
          ? 236.588
          : /^(l|liters?|litres?)$/.test(sourceUnit)
            ? 1000
            : 1);
      amount = milliliters / 29.5735;
      unit = "fl oz";
    } else if (units === "metric" && isImperialMass) {
      const grams =
        sourceAmount *
        (/^(lb|lbs|pound|pounds)$/.test(sourceUnit) ? 453.59237 : 28.3495);
      amount = grams;
      unit = "g";
      if (amount >= 1000) {
        amount /= 1000;
        unit = "kg";
      }
    } else if (units === "metric" && isImperialVolume) {
      amount = sourceAmount * 29.5735;
      unit = "ml";
    } else if (units === "metric" && /^cups?$/.test(sourceUnit)) {
      amount = sourceAmount * 236.588;
      unit = "ml";
    } else if (units === "metric" && /^(l|liters?|litres?)$/.test(sourceUnit)) {
      unit = "L";
    } else if (
      units === "imperial" &&
      isMetricVolume &&
      /^(l|liters?|litres?)$/.test(sourceUnit)
    ) {
      amount = sourceAmount * 33.814;
      unit = "fl oz";
    }

    const formattedAmount = Number.isInteger(amount)
      ? String(amount)
      : amount.toFixed(amount < 10 ? 2 : 1);
    return portionSize.replace(quantity[0], `${formattedAmount} ${unit}`);
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
              ? "text-muted-light dark:text-muted-dark"
              : "text-ink-light dark:text-ink-dark"
          }`}
        >
          {value}
        </Text>
        <Text className="text-[10px] font-semibold text-muted-light dark:text-muted-dark">
          {unit}
        </Text>
      </View>
      {unavailable ? (
        <Text className="mt-1 text-[9px] leading-3 text-muted-light dark:text-muted-dark">
          Non estimé
        </Text>
      ) : null}
    </View>
  );
}

export default function ResultScreen() {
  const { scan } = useScanSession();
  const draft = scan?.analysis === null && scan.imageBase64
    ? { imageUri: scan.imageUri, imageBase64: scan.imageBase64 }
    : null;
  const progressive = useScanResult(draft);
  useEffect(() => {
    if (draft && progressive.state.status === "done") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  }, [scan?.imageUri, progressive.state.status]);
  if (draft && progressive.state.status !== "done") {
    return <ScanResultSheet state={progressive.state} onRetry={progressive.retry} onCancel={progressive.cancel} />;
  }
  const completeScan = scan && progressive.state.analysis
    ? { ...scan, analysis: progressive.state.analysis }
    : scan;
  return <ResultContent key={completeScan?.imageUri ?? "empty"} scan={completeScan} />;
}

const EMPTY_ANALYSIS: FoodAnalysis = {
  foodName: "",
  description: "",
  estimatedCalories: null,
  portionSize: null,
  ingredients: [],
  confidence: null,
};

function ResultContent({ scan }: { scan: ScanSession | null }) {
  const { settings } = useAppSettings();
  const {
    addEntry,
    goal,
    entries,
    isLoading: isDiaryLoading,
    error: diaryError,
  } = useDailyCalories();
  const analysis = scan?.analysis ?? EMPTY_ANALYSIS;
  const [foodName, setFoodName] = useState(analysis.foodName);
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [portionValue, setPortionValue] = useState(1);
  const [isCustomPortion, setIsCustomPortion] = useState(false);
  const [customGrams, setCustomGrams] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const submissionLock = useRef(false);

  const back = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const changePhoto = (source: "camera" | "gallery") => {
    router.push(
      source === "gallery"
        ? { pathname: "/scanner", params: { source: "gallery" } }
        : "/scanner",
    );
  };

  const baseCalories = analysis.estimatedCalories;
  const basePortionGrams = getPortionGrams(analysis.portionSize);
  const customQuantity = Number(customGrams.replace(",", "."));
  const isCustomQuantityValid =
    customGrams.trim().length > 0 &&
    Number.isFinite(customQuantity) &&
    customQuantity > 0 &&
    customQuantity <= 10_000;
  const portionMultiplier = isCustomPortion
    ? isCustomQuantityValid && basePortionGrams !== null
      ? customQuantity / basePortionGrams
      : null
    : portionValue;
  const calories =
    baseCalories === null || portionMultiplier === null
      ? null
      : Math.round(baseCalories * portionMultiplier);
  const selectedPortionLabel = isCustomPortion
    ? isCustomQuantityValid
      ? formatGrams(customQuantity)
      : "Enter a quantity in grams"
    : basePortionGrams !== null
      ? formatGrams(basePortionGrams * (portionMultiplier ?? 1))
      : getPortionLabel(
          analysis.portionSize,
          portionMultiplier ?? 1,
          settings.units,
        );
  const portionVisualScale = Math.min(
    1.4,
    Math.max(0.7, portionMultiplier ?? 1),
  );
  const portionImageStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          scale: withSpring(portionVisualScale, {
            damping: 14,
            stiffness: 160,
          }),
        },
      ],
    }),
    [portionVisualScale],
  );

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
      setLogError(
        cause instanceof Error
          ? cause.message
          : "Could not add this meal to your diary.",
      );
    } finally {
      submissionLock.current = false;
      setIsLogging(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-canvas-light dark:bg-canvas-dark"
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="mx-auto w-full max-w-[560px] flex-grow px-5 pb-5 sm:px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="min-h-[58px] flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={back}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark"
            >
              <Text className="text-[27px] leading-8 text-ink-light dark:text-ink-dark">
                ‹
              </Text>
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
              className="flex-1 items-center justify-center py-16"
            >
              <View className="h-[68px] w-[68px] items-center justify-center rounded-[23px] bg-brand-secondary dark:bg-selected-dark">
                <Text className="text-[30px] text-brand-primary">⌕</Text>
              </View>
              <Text className="mt-5 text-center text-[26px] font-bold tracking-[-0.6px] text-ink-light dark:text-ink-dark">
                Aucune analyse à consulter
              </Text>
              <Text className="mt-2 max-w-[280px] text-center text-sm leading-[21px] text-muted-light dark:text-muted-dark">
                Prends ou choisis une photo de ton repas pour obtenir une
                estimation.
              </Text>
              <FoodButton
                label="Scanner un repas"
                trailing="→"
                className="mt-6 self-stretch"
                onPress={() => router.replace("/scanner")}
              />
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.duration(280)}
              layout={Layout.springify()}
            >
              <View className="pb-[15px] pt-5">
                <Text className="text-[10px] font-bold tracking-[1.4px] text-brand-primary">
                  ANALYSE DE TON REPAS
                </Text>
                <Text className="mt-[7px] text-[28px] font-bold leading-[34px] tracking-[-0.8px] text-ink-light dark:text-ink-dark">
                  Personnalise ton résultat.
                </Text>
              </View>

              <View className="flex-row items-center gap-3 rounded-[20px] bg-canvas-light p-3 dark:bg-canvas-dark">
                <View className="h-[82px] w-[82px] overflow-hidden rounded-[15px] bg-[#18251E]">
                  <StyledImage
                    source={{ uri: scan.imageUri }}
                    contentFit="cover"
                    className="h-full w-full"
                  />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[14px] font-bold text-ink-light dark:text-ink-dark">
                    Résultat estimé
                  </Text>
                  <Text className="text-[11px] leading-4 text-muted-light dark:text-muted-dark">
                    Les valeurs peuvent varier selon les ingrédients et la
                    portion.
                  </Text>
                  <View className="self-start rounded-full bg-brand-secondary px-2 py-1 dark:bg-selected-dark">
                    <Text className="text-[9px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                      ESTIMATION
                    </Text>
                  </View>
                </View>
                <View className="gap-1">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reprendre la photo du repas"
                    disabled={isLogging || logged}
                    onPress={() => changePhoto("camera")}
                    className="min-h-11 items-center justify-center rounded-full bg-brand-primary px-3 disabled:opacity-50"
                  >
                    <Text className="text-[10px] font-bold text-white">
                      Reprendre
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choisir une autre photo du repas"
                    disabled={isLogging || logged}
                    onPress={() => changePhoto("gallery")}
                    className="min-h-11 items-center justify-center rounded-full bg-surface-light px-3 dark:bg-surface-dark disabled:opacity-50"
                  >
                    <Text className="text-[10px] font-bold text-ink-light dark:text-ink-dark">
                      Galerie
                    </Text>
                  </Pressable>
                </View>
              </View>

              {analysis.description ||
              analysis.ingredients.length > 0 ? (
                <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                  <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                    CE QUE L’ON VOIT
                  </Text>
                  {analysis.description ? (
                    <Text className="mt-2 text-[13px] leading-[19px] text-ink-light dark:text-ink-dark">
                      {analysis.description}
                    </Text>
                  ) : null}
                  {analysis.ingredients.length > 0 ? (
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {analysis.ingredients.map((ingredient) => (
                        <View
                          key={ingredient}
                          className="rounded-full bg-brand-secondary px-3 py-[7px] dark:bg-selected-dark"
                        >
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
                    PLAT DÉTECTÉ
                  </Text>
                  <Text className="text-[10px] font-semibold text-brand-primary dark:text-[#A8C8B2]">
                    MODIFIABLE
                  </Text>
                </View>
                <TextInput
                  accessibilityLabel="Edit detected food name"
                  value={foodName}
                  onChangeText={setFoodName}
                  editable={!logged && !isLogging}
                  maxLength={100}
                  returnKeyType="done"
                  placeholder="Nom du plat"
                  placeholderTextColor="#68736B"
                  className="mt-1 h-[46px] border-b border-brand-border text-[20px] font-bold tracking-[-0.4px] text-ink-light dark:border-selected-dark dark:text-ink-dark"
                />
                {analysis.confidence !== null ? (
                  <Text className="mt-[9px] text-[11px] text-muted-light dark:text-muted-dark">
                    Correspondance visuelle ·{" "}
                    {Math.round(analysis.confidence * 100)} %
                  </Text>
                ) : null}
              </View>

              <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                      VALEURS NUTRITIONNELLES
                    </Text>
                    <Text className="mt-[3px] text-[11px] text-muted-light dark:text-muted-dark">
                      Estimation pour la portion sélectionnée
                    </Text>
                  </View>
                  <View className="rounded-full bg-brand-secondary px-[10px] py-[6px] dark:bg-selected-dark">
                    <Text className="text-[9px] font-bold tracking-[0.5px] text-brand-primary dark:text-[#A8C8B2]">
                      ESTIMÉ
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
                        {calories === null
                          ? "Aucune estimation visuelle"
                          : "Énergie approximative"}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[30px] font-bold leading-9 tracking-[-1px] text-ink-light dark:text-ink-dark">
                    {calories === null ? "—" : calories.toLocaleString()}
                  </Text>
                </View>

                <View className="mt-3 flex-row gap-2">
                  <NutritionCard
                    label="PROTÉINES"
                    value="—"
                    unit="g"
                    unavailable
                  />
                  <NutritionCard
                    label="GLUCIDES"
                    value="—"
                    unit="g"
                    unavailable
                  />
                  <NutritionCard
                    label="LIPIDES"
                    value="—"
                    unit="g"
                    unavailable
                  />
                </View>
                <Text className="mt-3 text-[10px] leading-[15px] text-muted-light dark:text-muted-dark">
                  Les macronutriments ne sont pas fournis par cette analyse :
                  FoodLens ne les invente pas.
                </Text>
              </View>

              <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                      AJUSTER LA PORTION
                    </Text>
                    <Text className="mt-[4px] text-[13px] font-semibold text-ink-light dark:text-ink-dark">
                      Ajuste la portion pour actualiser les calories
                    </Text>
                  </View>
                </View>

                <View
                  accessibilityLabel={`Visual portion preview: ${selectedPortionLabel}`}
                  className="mt-4 min-h-[157px] flex-row items-center justify-center gap-5 rounded-[17px] bg-canvas-light px-4 py-3 dark:bg-canvas-dark"
                >
                  <View className="h-[128px] w-[128px] items-center justify-center rounded-full border-[7px] border-white bg-[#E4E8DE] dark:border-[#455249] dark:bg-[#303A33]">
                    <Animated.View
                      style={portionImageStyle}
                      className="h-[92px] w-[92px] overflow-hidden rounded-full"
                    >
                      <StyledImage
                        source={{ uri: scan.imageUri }}
                        contentFit="cover"
                        className="h-full w-full"
                      />
                    </Animated.View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold tracking-[0.8px] text-muted-light dark:text-muted-dark">
                      SELECTED PORTION
                    </Text>
                    <Text
                      numberOfLines={2}
                      className="mt-1 text-[17px] font-bold leading-[21px] text-ink-light dark:text-ink-dark"
                    >
                      {selectedPortionLabel}
                    </Text>
                    <Text className="mt-2 text-[10px] leading-[15px] text-muted-light dark:text-muted-dark">
                      Estimate only
                    </Text>
                  </View>
                </View>

                <Slider
                  accessibilityLabel="Ajuster la taille de la portion"
                  accessibilityHint="Fais glisser pour ajuster les calories estimées"
                  value={portionValue}
                  minimumValue={0.5}
                  maximumValue={1.5}
                  step={0.05}
                  minimumTrackTintColor="#245C45"
                  maximumTrackTintColor="#DCEBDD"
                  thumbTintColor="#245C45"
                  disabled={logged || isLogging || isCustomPortion}
                  onValueChange={(value) => {
                    setIsCustomPortion(false);
                    setPortionValue(value);
                  }}
                  style={{ width: "100%", height: 44 }}
                />
                <View className="flex-row justify-between">
                  <Text className="text-[10px] text-muted-light dark:text-muted-dark">
                    ½ portion
                  </Text>
                  <Text className="text-[11px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                    {isCustomPortion
                      ? "Personnalisée"
                      : `${portionValue.toFixed(2).replace(/0$/, "").replace(/\.$/, "")}×`}
                  </Text>
                  <Text className="text-[10px] text-muted-light dark:text-muted-dark">
                    1½ portion
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Saisir une portion personnalisée en grammes"
                  accessibilityState={{
                    selected: isCustomPortion,
                    disabled: logged || isLogging,
                  }}
                  disabled={logged || isLogging}
                  onPress={() => setIsCustomPortion((current) => !current)}
                  className={`mt-3 min-h-11 items-center justify-center rounded-[13px] border ${
                    isCustomPortion
                      ? "border-brand-primary bg-brand-primary"
                      : "border-brand-border bg-canvas-light dark:border-selected-dark dark:bg-canvas-dark"
                  }`}
                >
                  <Text
                    className={`text-[12px] font-bold ${
                      isCustomPortion
                        ? "text-white"
                        : "text-muted-light dark:text-muted-dark"
                    }`}
                  >
                    {isCustomPortion
                      ? "Portion personnalisée"
                      : "Saisir une quantité précise"}
                  </Text>
                </Pressable>

                {isCustomPortion ? (
                  <View className="mt-3 flex-row items-center rounded-[14px] border border-brand-border bg-canvas-light px-3 dark:border-selected-dark dark:bg-canvas-dark">
                    <TextInput
                      accessibilityLabel="Custom portion in grams"
                      value={customGrams}
                      onChangeText={setCustomGrams}
                      editable={!logged && !isLogging}
                      keyboardType="decimal-pad"
                      maxLength={7}
                      placeholder="Saisir une quantité en grammes"
                      placeholderTextColor="#68736B"
                      className="h-[48px] flex-1 text-[14px] font-semibold text-ink-light dark:text-ink-dark"
                    />
                    <Text className="text-[12px] font-bold text-muted-light dark:text-muted-dark">
                      g
                    </Text>
                  </View>
                ) : null}

                <Text className="mt-[10px] text-[10px] leading-[15px] text-muted-light dark:text-muted-dark">
                  {isCustomPortion && basePortionGrams === null
                    ? "Aucun poids de référence : les calories ne peuvent pas être ajustées en grammes."
                    : isCustomPortion && !isCustomQuantityValid
                      ? "Saisis une quantité supérieure à 0 et inférieure ou égale à 10 000 g."
                      : "Les calories sont recalculées à partir de la portion estimée. Les valeurs réelles peuvent varier."}
                </Text>
              </View>

              <View className="mt-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[17px] dark:border-selected-dark dark:bg-surface-dark">
                <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">
                  AJOUTER AU JOURNAL
                </Text>
                <Text className="mt-[5px] text-[17px] font-bold text-ink-light dark:text-ink-dark">
                  Choisis le type de repas
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {MEAL_TYPES.map((type) => {
                    const selected = mealType === type;
                    return (
                      <Pressable
                        key={type}
                        accessibilityRole="button"
                        accessibilityLabel={`Type de repas : ${MEAL_TYPE_LABELS[type]}`}
                        accessibilityState={{ selected, disabled: logged }}
                        disabled={logged}
                        onPress={() => setMealType(type)}
                        className={`min-h-[40px] items-center justify-center rounded-full border px-[14px] ${
                          selected
                            ? "border-brand-primary bg-brand-primary"
                            : "border-brand-border bg-canvas-light dark:border-selected-dark dark:bg-canvas-dark"
                        } disabled:opacity-55`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            selected
                              ? "text-white"
                              : "text-muted-light dark:text-muted-dark"
                          }`}
                        >
                          {MEAL_TYPE_LABELS[type]}
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
                        OBJECTIF DU JOUR · APRÈS AJOUT
                      </Text>
                      <Text className="text-[11px] font-bold text-ink-light dark:text-ink-dark">
                        {projectedCalories.toLocaleString()} /{" "}
                        {dailyGoal.toLocaleString()} kcal
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
                        ? "L’objectif quotidien sera atteint ou dépassé."
                        : `Il restera ${remainingAfterMeal?.toLocaleString()} kcal après l’ajout.`}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="mt-4 flex-row items-start gap-[10px] rounded-[15px] bg-[#F4EBDD] p-[13px] dark:bg-[#393127]">
                <Text className="h-[19px] w-[19px] overflow-hidden rounded-full bg-[#E9D1AF] text-center text-xs font-bold leading-[19px] text-[#78572F]">
                  i
                </Text>
                <Text className="flex-1 text-[10px] leading-[15px] text-[#705C42] dark:text-[#E2D3BA]">
                  Cette estimation visuelle n’est pas une donnée nutritionnelle
                  vérifiée. Les valeurs varient selon les ingrédients, la
                  préparation et la portion.
                </Text>
              </View>

              {diaryError ? (
                <Text
                  accessibilityRole="alert"
                  className="mt-3 text-[11px] leading-[17px] text-[#A53F35]"
                >
                  Impossible d’actualiser le journal du jour : {diaryError}
                </Text>
              ) : null}
              {logError ? (
                <Text
                  accessibilityRole="alert"
                  className="mt-3 text-[11px] leading-[17px] text-[#A53F35]"
                >
                  {logError}
                </Text>
              ) : null}

              <View className="mt-7 flex-row items-center justify-center gap-[9px] border-t-[0.5px] border-brand-border pt-[17px]">
                <BrandMark size={26} />
                <Text className="text-[10px] text-muted-light dark:text-muted-dark">
                  A helpful estimate, never a diagnosis.
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
        {scan ? (
          <View className="border-t border-selected-light bg-surface-light px-5 pb-3 pt-3 dark:border-selected-dark dark:bg-surface-dark">
            <FoodButton
              label={
                logged
                  ? "Repas ajouté au journal"
                  : isLogging
                    ? "Ajout au journal…"
                    : "Ajouter au journal"
              }
              hint={
                logged
                  ? `${calories?.toLocaleString("fr-FR")} kcal · ${mealType}`
                  : !mealType
                    ? "Choisis petit-déjeuner, déjeuner, dîner ou collation"
                    : calories === null || calories <= 0
                      ? "Une estimation calorique positive est requise"
                      : "Enregistre cette estimation dans ton journal du jour"
              }
              variant={logged ? "secondary" : "primary"}
              trailing={logged || isLogging ? undefined : "＋"}
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reprendre la photo"
              disabled={isLogging}
              onPress={() => router.replace("/scanner")}
              className="mt-1 min-h-11 items-center justify-center disabled:opacity-50"
            >
              <Text className="text-[13px] font-semibold text-muted-light dark:text-muted-dark">
                Reprendre la photo
              </Text>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

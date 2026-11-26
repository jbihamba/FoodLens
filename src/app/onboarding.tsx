import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/food/BrandMark";
import { Pressable, Text } from "@/components/LocalizedText";
import { StyledImage } from "@/components/nativewind-interop";
import { AppButton } from "@/components/ui/AppButton";
import { FitnessIcon, NutritionIcon, ProgressIcon } from "@/components/ui/Icons";
import type { UserFocus } from "@/services/appSettings";
import { completeOnboarding } from "@/services/calorieTracking";
import { useAppSettings } from "@/stores/app-settings";

const slides = [
  {
    eyebrow: "NUTRITION SIMPLIFIÉE",
    title: "Scanne tes repas\nen un geste.",
    description:
      "Prends une photo de ton assiette pour estimer les calories et comprendre ce que tu manges.",
  },
  {
    eyebrow: "FITNESS GUIDÉ",
    title: "Bouge à ton\npropre rythme.",
    description:
      "Choisis une zone musculaire et suis des séances courtes avec démonstrations et chronomètre.",
  },
  {
    eyebrow: "TON EXPÉRIENCE",
    title: "Par quoi veux-tu\ncommencer ?",
    description:
      "FoodLens s'adapte à tes envies. Tu pourras changer ce choix à tout moment dans ton profil.",
  },
];

const focusChoices: {
  value: UserFocus;
  title: string;
  subtitle: string;
}[] = [
  {
    value: "nutrition",
    title: "Nutrition d'abord",
    subtitle: "Scanner mes repas et suivre mes calories",
  },
  {
    value: "balanced",
    title: "Nutrition & Fitness",
    subtitle: "L'expérience complète, pas à pas",
  },
  {
    value: "fitness",
    title: "Fitness d'abord",
    subtitle: "Découvrir les entraînements guidés",
  },
];

function WelcomeArtwork({ height }: { height: number }) {
  return (
    <View
      className="w-full overflow-hidden rounded-[28px] bg-selected-light dark:bg-selected-dark"
      style={{ height }}
    >
      <StyledImage
        source={require("../../assets/images/food-meal.jpg")}
        contentFit="cover"
        className="h-full w-full"
      />
      <View className="absolute inset-0 bg-[#17241D33]" />
      <View className="absolute bottom-4 left-4 right-4 flex-row items-center gap-3 rounded-[18px] bg-white/95 px-4 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-secondary">
          <NutritionIcon size={20} color="#245C45" />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-bold tracking-[0.8px] text-brand-primary">
            FOODLENS SCAN
          </Text>
          <Text className="mt-0.5 text-[13px] font-bold text-ink-light">
            Calories & nutriments en quelques secondes
          </Text>
        </View>
      </View>
    </View>
  );
}

function FitnessArtwork({ height }: { height: number }) {
  return (
    <View
      className="w-full justify-center rounded-[28px] bg-fitness-softLight p-5 dark:bg-fitness-softDark"
      style={{ height }}
    >
      <View className="rounded-[22px] bg-surface-light p-5 dark:bg-surface-dark">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-fitness-softLight dark:bg-fitness-softDark">
            <FitnessIcon size={24} color="#D97736" />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] font-bold tracking-[0.8px] text-fitness-primary dark:text-fitness-dark">
              SÉANCE GUIDÉE
            </Text>
            <Text className="mt-0.5 text-[18px] font-extrabold text-ink-light dark:text-ink-dark">
              Corps entier express
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-[12px] bg-canvas-light px-3 py-2 dark:bg-canvas-dark">
            <Text className="text-[13px] font-bold text-ink-light dark:text-ink-dark">
              5 min
            </Text>
            <Text className="text-[11px] text-muted-light dark:text-muted-dark">
              Durée
            </Text>
          </View>
          <View className="flex-1 rounded-[12px] bg-canvas-light px-3 py-2 dark:bg-canvas-dark">
            <Text className="text-[13px] font-bold text-ink-light dark:text-ink-dark">
              Sans matériel
            </Text>
            <Text className="text-[11px] text-muted-light dark:text-muted-dark">
              Équipement
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function FocusSelector({
  selectedFocus,
  onSelect,
}: {
  selectedFocus: UserFocus;
  onSelect: (focus: UserFocus) => void;
}) {
  return (
    <View className="gap-2.5">
      {focusChoices.map((choice) => {
        const isSelected = selectedFocus === choice.value;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(choice.value)}
            className={`flex-row items-center gap-3.5 rounded-[20px] border p-4 ${
              isSelected
                ? "border-brand-primary bg-brand-secondary/50 dark:border-[#8CC0A0] dark:bg-selected-dark"
                : "border-brand-border bg-surface-light dark:border-selected-dark dark:bg-surface-dark"
            }`}
          >
            <View
              className={`h-11 w-11 items-center justify-center rounded-[14px] ${
                choice.value === "fitness"
                  ? "bg-fitness-softLight dark:bg-fitness-softDark"
                  : "bg-brand-secondary dark:bg-selected-dark"
              }`}
            >
              {choice.value === "nutrition" ? (
                <NutritionIcon size={20} color="#245C45" />
              ) : choice.value === "fitness" ? (
                <FitnessIcon size={20} color="#D97736" />
              ) : (
                <ProgressIcon size={20} color="#245C45" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
                {choice.title}
              </Text>
              <Text className="mt-0.5 text-[12px] text-muted-light dark:text-muted-dark">
                {choice.subtitle}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const { setFocus } = useAppSettings();
  const { height, width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedFocus, setSelectedFocus] = useState<UserFocus>("balanced");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const artworkHeight = Math.min(
    290,
    Math.max(170, height * (height < 700 ? 0.27 : 0.32)),
  );
  const slideWidth = Math.min(width, 560) - 48;
  const previousWidth = useRef(slideWidth);

  useEffect(() => {
    if (previousWidth.current !== slideWidth) {
      previousWidth.current = slideWidth;
      scrollRef.current?.scrollTo({
        x: slideWidth * currentPage,
        animated: false,
      });
    }
  }, [currentPage, slideWidth]);

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ x: slideWidth * page, animated: true });
    setCurrentPage(page);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentPage(Math.round(event.nativeEvent.contentOffset.x / slideWidth));
  };

  const finish = async () => {
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      await setFocus(selectedFocus);
      await completeOnboarding(db);
      router.replace("/");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer tes préférences.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <View className="mx-auto w-full max-w-[560px] flex-1 px-6">
        <View className="min-h-[58px] flex-row items-center justify-between">
          <View className="flex-row items-center gap-[10px]">
            <BrandMark size={34} />
            <Text className="text-[18px] font-bold tracking-[-0.4px] text-ink-light dark:text-ink-dark">
              FoodLens
            </Text>
          </View>
          {currentPage < slides.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void finish()}
              className="min-h-11 items-center justify-center px-2"
            >
              <Text className="text-sm font-semibold text-muted-light dark:text-muted-dark">
                Passer
              </Text>
            </Pressable>
          ) : (
            <View className="w-[45px]" />
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
          accessibilityLabel="Présentation de FoodLens"
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {slides.map((slide, index) => (
            <View
              key={slide.eyebrow}
              className="flex-1 justify-center"
              style={{ width: slideWidth }}
            >
              <View className="mx-auto w-full max-w-[480px]">
                {index === 0 ? (
                  <WelcomeArtwork height={artworkHeight} />
                ) : index === 1 ? (
                  <FitnessArtwork height={artworkHeight} />
                ) : (
                  <FocusSelector
                    selectedFocus={selectedFocus}
                    onSelect={setSelectedFocus}
                  />
                )}
                <View className="mt-6">
                  <Text className="text-[10px] font-bold tracking-[1.2px] text-brand-primary dark:text-[#8CC0A0]">
                    {slide.eyebrow}
                  </Text>
                  <Text className="mt-2 text-[28px] font-extrabold leading-[34px] tracking-[-0.6px] text-ink-light dark:text-ink-dark">
                    {slide.title}
                  </Text>
                  <Text className="mt-2 text-[14px] leading-[21px] text-muted-light dark:text-muted-dark">
                    {slide.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="mx-auto w-full max-w-[480px] pb-3 pt-2">
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Étape ${currentPage + 1} sur ${slides.length}`}
            className="mb-4 flex-row items-center justify-center gap-2"
          >
            {slides.map((slide, index) => (
              <View
                key={slide.eyebrow}
                className={`h-[7px] rounded-full ${
                  index === currentPage
                    ? "w-[22px] bg-brand-primary"
                    : "w-[7px] bg-selected-light dark:bg-selected-dark"
                }`}
              />
            ))}
          </View>

          {error ? (
            <Text
              accessibilityRole="alert"
              className="mb-2 text-center text-xs text-danger-light dark:text-danger-dark"
            >
              {error}
            </Text>
          ) : null}

          <AppButton
            label={
              isSaving
                ? "Enregistrement…"
                : currentPage === slides.length - 1
                  ? "Commencer"
                  : "Suivant"
            }
            variant="primary"
            loading={isSaving}
            onPress={() => {
              if (currentPage === slides.length - 1) {
                void finish();
              } else {
                goToPage(currentPage + 1);
              }
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

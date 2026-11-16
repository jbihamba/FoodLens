import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type ScrollViewInstance,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { BrandMark } from '@/components/food/BrandMark';
import { StyledImage } from '@/components/nativewind-interop';
import { completeOnboarding } from '@/services/calorieTracking';

const slides = [
  {
    eyebrow: 'A FRESH LOOK AT EVERY MEAL',
    title: 'Welcome to\nFoodLens.',
    description: 'Snap a photo of your meal and let FoodLens help you understand what’s on your plate.',
  },
  {
    eyebrow: 'KNOW WHAT’S ON YOUR PLATE',
    title: 'Discover your\nnutrition.',
    description: 'Recognize foods and get a helpful calorie estimate, alongside the nutrients that make up your meal.',
  },
  {
    eyebrow: 'BUILD HABITS THAT FEEL GOOD',
    title: 'Track your\nprogress.',
    description: 'Set a daily calorie goal, revisit your food history, and get to know your eating habits over time.',
  },
];

function WelcomeArtwork({ height }: { height: number }) {
  return (
    <View
      className="w-full overflow-hidden rounded-[28px] bg-selected-light dark:bg-selected-dark"
      style={{ height }}>
      <StyledImage
        source={require('../../assets/images/food-meal.jpg')}
        contentFit="cover"
        className="h-full w-full"
      />
      <View className="absolute inset-0 bg-[#17241D33]" />
      <View className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-2">
        <Text className="text-[11px] font-bold text-brand-primary">A closer look at your plate</Text>
      </View>
      <View className="absolute bottom-4 right-4 flex-row items-center gap-2 rounded-[16px] bg-white px-3 py-[10px]">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-selected-light">
          <Text className="text-base">✦</Text>
        </View>
        <View>
          <Text className="text-[10px] font-semibold text-muted-light">FOODLENS SCAN</Text>
          <Text className="mt-[2px] text-xs font-bold text-ink-light">Your meal, in focus</Text>
        </View>
      </View>
    </View>
  );
}

function NutritionArtwork({ height }: { height: number }) {
  const nutrients = [
    { label: 'Protein', amount: '28g', color: 'bg-[#245C45]' },
    { label: 'Carbs', amount: '42g', color: 'bg-[#F2A65A]' },
    { label: 'Fat', amount: '16g', color: 'bg-[#92B88A]' },
  ];

  return (
    <View
      className="w-full justify-center rounded-[28px] bg-[#E8F0E7] p-4 dark:bg-[#26372D]"
      style={{ height }}>
      <View className="rounded-[22px] bg-white p-4 dark:bg-surface-dark">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold tracking-[1px] text-muted-light dark:text-muted-dark">
              MEAL ESTIMATE
            </Text>
            <Text className="mt-1 text-[19px] font-bold text-ink-light dark:text-ink-dark">
              Grilled salmon
            </Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-selected-light dark:bg-selected-dark">
            <Text className="text-lg">🥗</Text>
          </View>
        </View>
        <View className="my-3 h-px bg-brand-border dark:bg-selected-dark" />
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-[10px] font-bold tracking-[0.8px] text-muted-light dark:text-muted-dark">
              CALORIES
            </Text>
            <Text className="mt-1 text-[27px] font-bold leading-8 text-brand-primary dark:text-[#A8C8B2]">
              520 <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">kcal</Text>
            </Text>
          </View>
          {nutrients.map((nutrient) => (
            <View key={nutrient.label} className="items-center">
              <View className={`mb-2 h-[5px] w-8 rounded-full ${nutrient.color}`} />
              <Text className="text-[11px] font-bold text-ink-light dark:text-ink-dark">
                {nutrient.amount}
              </Text>
              <Text className="mt-[2px] text-[9px] text-muted-light dark:text-muted-dark">
                {nutrient.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full border-[10px] border-[#FFFFFF55]" />
    </View>
  );
}

function ProgressArtwork({ height }: { height: number }) {
  return (
    <View
      className="w-full justify-center rounded-[28px] bg-[#E8F0E7] p-4 dark:bg-[#26372D]"
      style={{ height }}>
      <View className="rounded-[22px] bg-white p-4 dark:bg-surface-dark">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold tracking-[1px] text-muted-light dark:text-muted-dark">
              TODAY&apos;S PROGRESS
            </Text>
            <Text className="mt-1 text-[19px] font-bold text-ink-light dark:text-ink-dark">
              Your daily goal
            </Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-selected-light dark:bg-selected-dark">
            <Text className="text-base">✓</Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-baseline justify-between">
          <Text className="text-[25px] font-bold text-brand-primary dark:text-[#A8C8B2]">
            1,240 <Text className="text-xs font-medium text-muted-light dark:text-muted-dark">/ 2,000 kcal</Text>
          </Text>
          <Text className="text-xs font-bold text-brand-primary dark:text-[#A8C8B2]">62%</Text>
        </View>
        <View className="mt-2 h-[9px] overflow-hidden rounded-full bg-[#E8F0E7] dark:bg-selected-dark">
          <View className="h-full w-[62%] rounded-full bg-brand-primary" />
        </View>
        <View className="mt-4 flex-row items-center justify-between border-t border-brand-border pt-3 dark:border-selected-dark">
          <View>
            <Text className="text-[10px] font-bold tracking-[0.7px] text-muted-light dark:text-muted-dark">
              FOOD HISTORY
            </Text>
            <Text className="mt-1 text-xs font-semibold text-ink-light dark:text-ink-dark">
              Breakfast · Lunch · Dinner
            </Text>
          </View>
          <Text className="text-sm font-bold text-brand-primary dark:text-[#A8C8B2]">3 meals</Text>
        </View>
      </View>
      <View className="absolute -right-1 -top-2 h-14 w-14 rounded-full border-[9px] border-[#FFFFFF55]" />
    </View>
  );
}

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const { height, width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const artworkHeight = Math.min(310, Math.max(165, height * (height < 700 ? 0.29 : 0.34)));
  const previousWidth = useRef(width);

  useEffect(() => {
    if (previousWidth.current !== width) {
      previousWidth.current = width;
      scrollRef.current?.scrollTo({ x: width * currentPage, animated: false });
    }
  }, [currentPage, width]);

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ x: width * page, animated: true });
    setCurrentPage(page);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const finish = async () => {
    if (isSaving) {
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await completeOnboarding(db);
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your onboarding progress.');
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
              className="min-h-11 items-center justify-center px-2">
              <Text className="text-sm font-semibold text-muted-light dark:text-muted-dark">
                Skip
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
          accessibilityLabel="FoodLens onboarding"
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}>
          {slides.map((slide, index) => (
            <View
              key={slide.eyebrow}
              className="flex-1 justify-center"
              style={{ width }}>
              <View className="mx-auto w-full max-w-[480px]">
                {index === 0 ? (
                  <WelcomeArtwork height={artworkHeight} />
                ) : index === 1 ? (
                  <NutritionArtwork height={artworkHeight} />
                ) : (
                  <ProgressArtwork height={artworkHeight} />
                )}
                <View className="mt-[22px]">
                  <Text className="text-[9px] font-bold tracking-[1.25px] text-brand-primary dark:text-[#A8C8B2]">
                    {slide.eyebrow}
                  </Text>
                  <Text className="mt-[9px] text-[31px] font-bold leading-[36px] tracking-[-1px] text-ink-light dark:text-ink-dark">
                    {slide.title}
                  </Text>
                  <Text className="mt-2 max-w-[440px] text-[14px] leading-[21px] text-muted-light dark:text-muted-dark">
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
            accessibilityLabel={`Onboarding page ${currentPage + 1} of ${slides.length}`}
            className="mb-[18px] flex-row items-center justify-center gap-[7px]">
            {slides.map((slide, index) => (
              <View
                key={slide.eyebrow}
                className={`h-[7px] rounded-full ${
                  index === currentPage ? 'w-[22px] bg-brand-primary' : 'w-[7px] bg-selected-light dark:bg-selected-dark'
                }`}
              />
            ))}
          </View>

          {error ? (
            <Text accessibilityRole="alert" className="mb-2 text-center text-xs text-[#A53F35]">
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              if (currentPage === slides.length - 1) {
                void finish();
              } else {
                goToPage(currentPage + 1);
              }
            }}
            className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-[18px] bg-brand-primary px-5 active:opacity-80 disabled:opacity-60">
            <Text className="text-base font-bold text-white">
              {isSaving
                ? 'Saving…'
                : currentPage === slides.length - 1
                  ? 'Get Started'
                  : 'Next'}
            </Text>
            {!isSaving && currentPage < slides.length - 1 ? (
              <Text aria-hidden className="text-lg font-semibold text-white">→</Text>
            ) : null}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

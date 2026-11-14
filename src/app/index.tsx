import { Link, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyCalorieCard } from '@/components/food/DailyCalorieCard';
import { BrandMark } from '@/components/food/BrandMark';
import { FoodButton } from '@/components/food/FoodButton';
import { StyledImage } from '@/components/nativewind-interop';
import { DEFAULT_DAILY_GOAL } from '@/services/calorieTracking';
import { useDailyCalories } from '@/stores/daily-calories';

const steps = [
  {
    number: '01',
    title: 'Snap your meal',
    description: 'Take a photo or choose one you love.',
  },
  {
    number: '02',
    title: 'Let FoodLens look',
    description: 'AI identifies the foods on your plate.',
  },
  {
    number: '03',
    title: 'Get an estimate',
    description: 'See a helpful calorie and portion estimate.',
  },
];

export default function HomeScreen() {
  const { goal, entries, isLoading, error, refresh } = useDailyCalories();
  const consumed = entries.reduce((total, entry) => total + entry.calories, 0);

  useFocusEffect(
    useCallback(() => {
      void refresh().catch(() => undefined);
    }, [refresh]),
  );

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView
        contentContainerClassName="mx-auto w-full max-w-[560px] self-center px-6 pb-[34px]"
        showsVerticalScrollIndicator={false}>
        <View className="min-h-[66px] flex-row items-center justify-between">
          <View className="flex-row items-center gap-[10px]">
            <BrandMark />
            <Text className="text-[20px] font-bold tracking-[-0.5px] text-ink-light dark:text-ink-dark">
              FoodLens
            </Text>
          </View>
          <Text className="text-[9px] font-bold tracking-[1.4px] text-muted-light dark:text-muted-dark">
            YOUR FOOD, IN FOCUS
          </Text>
        </View>

        <View className="pt-[29px]">
          <View className="flex-row items-center gap-2">
            <View className="h-[7px] w-[7px] rounded-full bg-brand-accent" />
            <Text className="text-[10px] font-bold tracking-[1.2px] text-brand-primary">
              A FRESH LOOK AT EVERY MEAL
            </Text>
          </View>
          <Text className="mt-[17px] text-[48px] font-bold leading-[52px] tracking-[-2px] text-ink-light dark:text-ink-dark">
            Eat well,{'\n'}
            <Text className="text-brand-primary dark:text-[#A8C8B2]">know more.</Text>
          </Text>
          <Text className="mt-[11px] text-[17px] leading-[25px] text-muted-light dark:text-muted-dark">
            Discover what&apos;s on your plate.
          </Text>

          <DailyCalorieCard
            goal={goal?.target_calories ?? DEFAULT_DAILY_GOAL}
            consumed={consumed}
            isLoading={isLoading || !goal}
            entries={entries}
          />
          {error ? (
            <Text accessibilityRole="alert" className="mt-2 text-xs text-[#A53F35]">
              {error}
            </Text>
          ) : null}

          {entries.length > 0 ? (
            <View className="mt-[20px]">
              <Text className="mb-[10px] text-[17px] font-bold text-ink-light dark:text-ink-dark">
                Today&apos;s meals
              </Text>
              <View className="gap-2">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={{ pathname: '/entry', params: { id: String(entry.id) } }}
                    asChild>
                    <Pressable
                      accessibilityRole="button"
                      className="min-h-[63px] flex-row items-center justify-between rounded-[16px] border-[0.5px] border-selected-light bg-surface-light px-[15px] py-3 dark:border-selected-dark dark:bg-surface-dark">
                      <View className="mr-3 flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-sm font-bold text-ink-light dark:text-ink-dark">
                          {entry.food_name}
                        </Text>
                        <Text className="mt-1 text-[11px] text-muted-light dark:text-muted-dark">
                          {entry.meal_type ?? 'Meal'} ·{' '}
                          {new Date(entry.consumed_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-brand-primary dark:text-[#A8C8B2]">
                        {entry.calories.toLocaleString()} kcal
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ) : isLoading ? (
            <View className="mt-4 min-h-8 flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#245C45" />
            </View>
          ) : null}

          <View className="mt-[25px] h-[190px] overflow-hidden rounded-[28px] bg-brand-primary">
            <StyledImage
              source={require('../../assets/images/food-meal.jpg')}
              contentFit="cover"
              className="h-full w-full"
            />
            <View className="absolute inset-0 bg-[#20282033]" />
            <View className="absolute bottom-[14px] left-[14px] right-[14px] rounded-[16px] bg-[#202820CC] px-[14px] py-[11px]">
              <Text className="text-[17px] font-bold leading-[22px] text-white">
                A little more mindful
              </Text>
              <Text className="mt-[4px] text-xs text-[#DCEBDD]">One meal at a time</Text>
            </View>
          </View>

          <View className="mt-[23px] gap-[11px]">
            <Link href="/scanner" asChild>
              <FoodButton
                label="Scan my food"
                hint="Use your camera or choose a photo"
                trailing="→"
              />
            </Link>
            <Link href="/entry" asChild>
              <FoodButton
                label="Add a meal manually"
                hint="Record a meal and calories without scanning"
                variant="outline"
                trailing="＋"
              />
            </Link>
          </View>
          <Text className="mt-3 text-center text-[11px] leading-4 text-muted-light dark:text-muted-dark">
            Calorie and portion values are estimates, not medical advice.
          </Text>
        </View>

        <View className="mt-[43px]">
          <View className="mb-4">
            <Text className="text-[21px] font-bold tracking-[-0.4px] text-ink-light dark:text-ink-dark">
              How it works
            </Text>
            <Text className="mt-[5px] text-[13px] leading-[19px] text-muted-light dark:text-muted-dark">
              Good food choices start with curiosity.
            </Text>
          </View>
          <View className="gap-[10px]">
            {steps.map((step) => (
              <View
                key={step.number}
                className="min-h-[78px] flex-row items-center gap-[15px] rounded-[18px] border-[0.5px] border-selected-light bg-surface-light p-4 dark:border-selected-dark dark:bg-surface-dark">
                <Text className="text-xs font-bold tracking-[0.6px] text-brand-primary">
                  {step.number}
                </Text>
                <View className="flex-1 gap-[3px]">
                  <Text className="text-sm font-bold text-ink-light dark:text-ink-dark">
                    {step.title}
                  </Text>
                  <Text className="text-xs leading-[17px] text-muted-light dark:text-muted-dark">
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-[34px] flex-row items-center justify-center gap-2 border-t-[0.5px] border-brand-border pt-[18px]">
          <BrandMark size={28} />
          <Text className="text-xs text-muted-light dark:text-muted-dark">
            Made for a more mindful plate.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

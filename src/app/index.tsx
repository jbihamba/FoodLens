import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DailyCalorieCard } from '@/components/food/DailyCalorieCard';
import { BrandMark } from '@/components/food/BrandMark';
import { FoodButton } from '@/components/food/FoodButton';
import { MealDiary } from '@/components/food/MealDiary';
import { StyledImage } from '@/components/nativewind-interop';
import { DEFAULT_DAILY_GOAL } from '@/services/calorieTracking';
import type { FoodEntry } from '@/services/calorieTracking';
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
  const { goal, entries, isLoading, error, refresh, deleteEntry } = useDailyCalories();
  const consumed = entries.reduce((total, entry) => total + entry.calories, 0);
  const [pendingDelete, setPendingDelete] = useState<FoodEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh().catch(() => undefined);
    }, [refresh]),
  );

  const confirmDelete = async () => {
    if (!pendingDelete || isDeleting) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      const deletedName = pendingDelete.food_name;
      await deleteEntry(pendingDelete.id);
      setPendingDelete(null);
      showToast(`${deletedName} removed from your diary`);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'Could not delete this meal.');
    } finally {
      setIsDeleting(false);
    }
  };

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

          {isLoading ? (
            <View className="mt-6 min-h-20 items-center justify-center rounded-[21px] border-[0.5px] border-selected-light bg-surface-light dark:border-selected-dark dark:bg-surface-dark">
              <ActivityIndicator size="small" color="#245C45" />
              <Text className="mt-2 text-[11px] text-muted-light dark:text-muted-dark">
                Loading today&apos;s diary…
              </Text>
            </View>
          ) : (
            <MealDiary
              entries={entries}
              onEdit={(id) => {
                router.push({ pathname: '/entry', params: { id: String(id) } });
              }}
              onDelete={(entry) => {
                setDeleteError(null);
                setPendingDelete(entry);
              }}
            />
          )}

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

      <Modal
        transparent
        animationType="fade"
        visible={pendingDelete !== null}
        onRequestClose={() => {
          if (!isDeleting) {
            setPendingDelete(null);
          }
        }}>
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full max-w-[390px] rounded-[24px] bg-surface-light p-5 dark:bg-surface-dark">
            <Text className="text-[19px] font-bold text-ink-light dark:text-ink-dark">
              Delete this meal?
            </Text>
            <Text className="mt-2 text-[13px] leading-5 text-muted-light dark:text-muted-dark">
              {pendingDelete
                ? `${pendingDelete.food_name} will be removed from your diary.`
                : 'This meal will be removed from your diary.'}
            </Text>
            {deleteError ? (
              <Text accessibilityRole="alert" className="mt-3 text-xs leading-[18px] text-[#A53F35]">
                {deleteError}
              </Text>
            ) : null}
            <View className="mt-5 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => setPendingDelete(null)}
                className="min-h-[48px] flex-1 items-center justify-center rounded-[15px] bg-canvas-light dark:bg-canvas-dark">
                <Text className="text-sm font-bold text-ink-light dark:text-ink-dark">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => void confirmDelete()}
                className="min-h-[48px] flex-1 items-center justify-center rounded-[15px] bg-[#A53F35] disabled:opacity-60">
                <Text className="text-sm font-bold text-white">
                  {isDeleting ? 'Deleting…' : 'Delete meal'}
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
          className="absolute bottom-5 left-5 right-5 self-center rounded-[16px] bg-[#202820] px-4 py-[13px]">
          <Text className="text-center text-[12px] font-semibold text-white">{toast}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

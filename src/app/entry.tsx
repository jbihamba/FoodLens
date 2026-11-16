import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { BrandMark } from '@/components/food/BrandMark';
import { FoodButton } from '@/components/food/FoodButton';
import { getFoodEntry, type FoodEntry } from '@/services/calorieTracking';
import { useDailyCalories } from '@/stores/daily-calories';

export default function EntryScreen() {
  const { id: routeId } = useLocalSearchParams<{ id?: string }>();
  const db = useSQLiteContext();
  const { addEntry, updateEntry, deleteEntry } = useDailyCalories();
  const isCreating = routeId === undefined;
  const entryId = Number(routeId);
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    if (isCreating) {
      return;
    }

    const loadEntry = async () => {
      try {
        if (!Number.isInteger(entryId) || entryId < 1) {
          throw new Error('This meal could not be found.');
        }
        const result = await getFoodEntry(db, entryId);
        if (isCurrent && result) {
          setEntry(result);
          setFoodName(result.food_name);
          setCalories(String(result.calories));
        } else if (isCurrent) {
          setError('This meal could not be found.');
        }
      } catch (cause) {
        if (isCurrent) {
          setError(cause instanceof Error ? cause.message : 'Could not load this meal.');
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

  const save = async () => {
    const value = Number(calories);
    if (!foodName.trim()) {
      setError('Enter a name for this meal.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Calories must be a positive number.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      if (isCreating) {
        await addEntry({ foodName, calories: value, mealType: 'Meal' });
      } else {
        await updateEntry(entryId, {
          foodName,
          calories: value,
          mealType: entry?.meal_type,
        });
      }
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this meal.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await deleteEntry(entryId);
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete this meal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="mx-auto w-full max-w-[560px] flex-grow px-6 pb-9"
          keyboardShouldPersistTaps="handled">
          <View className="min-h-[58px] flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel editing meal"
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center">
              <Text className="-mt-1 text-[37px] leading-10 text-ink-light dark:text-ink-dark">
                ‹
              </Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              <BrandMark size={34} />
              <Text className="text-base font-bold text-ink-light dark:text-ink-dark">
                Edit meal
              </Text>
            </View>
            <View className="w-10" />
          </View>

          {!isCreating && isLoading ? (
            <Text className="pt-8 text-sm text-muted-light dark:text-muted-dark">
              Loading meal…
            </Text>
          ) : entry || isCreating ? (
            <View className="pt-[37px]">
              <Text className="text-[10px] font-bold tracking-[1.3px] text-brand-primary">
                TODAY&apos;S FOOD LOG
              </Text>
              <Text className="mt-3 text-[31px] font-bold tracking-[-0.8px] text-ink-light dark:text-ink-dark">
                {isCreating ? 'Add a meal' : 'Update your meal'}
              </Text>

              <View className="mt-7 gap-4 rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[18px] dark:border-selected-dark dark:bg-surface-dark">
                <View>
                  <Text className="text-xs font-bold text-ink-light dark:text-ink-dark">
                    Meal name
                  </Text>
                  <TextInput
                    accessibilityLabel="Meal name"
                    className="mt-2 h-[52px] rounded-[14px] border border-brand-border px-[14px] text-base text-ink-light dark:border-selected-dark dark:text-ink-dark"
                    value={foodName}
                    onChangeText={setFoodName}
                    editable={!isSaving}
                    maxLength={100}
                    returnKeyType="next"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-ink-light dark:text-ink-dark">
                    Calories
                  </Text>
                  <TextInput
                    accessibilityLabel="Meal calories"
                    className="mt-2 h-[52px] rounded-[14px] border border-brand-border px-[14px] text-base text-ink-light dark:border-selected-dark dark:text-ink-dark"
                    value={calories}
                    onChangeText={setCalories}
                    keyboardType="decimal-pad"
                    editable={!isSaving}
                  />
                </View>
              </View>

              {error ? (
                <Text accessibilityRole="alert" className="mt-3 text-xs leading-[18px] text-[#A53F35]">
                  {error}
                </Text>
              ) : null}

              <View className="mt-5 gap-[10px]">
                <FoodButton
                  label={
                    isSaving
                      ? 'Saving…'
                      : isCreating
                        ? 'Add to today’s log'
                        : 'Save changes'
                  }
                  trailing={isSaving ? undefined : '→'}
                  disabled={isSaving}
                  onPress={() => void save()}
                />
                {!isCreating ? (
                  <FoodButton
                    label="Delete meal"
                    variant="outline"
                    disabled={isSaving}
                    onPress={() => void remove()}
                  />
                ) : null}
                <FoodButton
                  label="Cancel"
                  variant="outline"
                  disabled={isSaving}
                  onPress={() => router.back()}
                />
              </View>
            </View>
          ) : error ? (
            <Text accessibilityRole="alert" className="pt-8 text-sm text-[#A53F35]">
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

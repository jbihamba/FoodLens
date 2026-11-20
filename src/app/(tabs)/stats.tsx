import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/LocalizedText';
import { CalorieProgressBar } from '@/components/food/CalorieProgressBar';
import { DEFAULT_DAILY_GOAL } from '@/services/calorieTracking';
import { useDailyCalories } from '@/stores/daily-calories';

export default function StatsScreen() {
  const { goal, entries } = useDailyCalories();
  const consumed = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const target = goal?.target_calories ?? DEFAULT_DAILY_GOAL;
  const totals = [
    { label: 'Protéines', key: 'protein_g' as const },
    { label: 'Glucides', key: 'carbs_g' as const },
    { label: 'Lipides', key: 'fat_g' as const },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-[28px] font-extrabold text-ink-light dark:text-ink-dark">Statistiques</Text>
        <Text className="mt-1 text-[13px] text-muted-light dark:text-muted-dark">
          Ton suivi nutritionnel du jour
        </Text>
        <View className="mt-5 rounded-[22px] border border-selected-light bg-surface-light p-5 dark:border-selected-dark dark:bg-surface-dark">
          <Text className="text-[13px] font-semibold text-muted-light dark:text-muted-dark">Calories</Text>
          <Text className="mt-2 text-[30px] font-extrabold text-ink-light dark:text-ink-dark">
            {Math.round(consumed).toLocaleString('fr-FR')}
            <Text className="text-[15px] font-semibold text-muted-light dark:text-muted-dark">
              {' '}/ {target.toLocaleString('fr-FR')} kcal
            </Text>
          </Text>
          <View className="mt-4">
            <CalorieProgressBar progress={(consumed / target) * 100} isGoalReached={consumed >= target} />
          </View>
        </View>
        <Text className="mb-3 mt-6 text-[17px] font-bold text-ink-light dark:text-ink-dark">
          Macros enregistrées
        </Text>
        <View className="gap-2">
          {totals.map(({ label, key }) => {
            const available = entries.some((entry) => entry[key] !== null);
            const amount = entries.reduce((sum, entry) => sum + (entry[key] ?? 0), 0);
            return (
              <View
                key={key}
                className="min-h-16 flex-row items-center justify-between rounded-[17px] bg-surface-light px-4 dark:bg-surface-dark">
                <Text className="text-[14px] font-semibold text-ink-light dark:text-ink-dark">{label}</Text>
                <Text className="text-[14px] font-bold text-brand-primary dark:text-[#A8C8B2]">
                  {available ? `${Math.round(amount)} g` : 'Non renseigné'}
                </Text>
              </View>
            );
          })}
        </View>
        <Text className="mt-3 text-[11px] leading-4 text-muted-light dark:text-muted-dark">
          Les macros non disponibles ne sont pas estimées ni inventées.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

import { View } from "react-native";

import { Text } from "@/components/LocalizedText";
import { ScanSkeleton } from "@/components/scan/ScanSkeleton";
import type { FoodAnalysis } from "@/types/food";

export function NutritionBlock({ analysis }: { analysis: FoodAnalysis | null }) {
  const macros = analysis?.macros;
  return (
    <View className="mt-4 rounded-[21px] bg-surface-light p-[17px] dark:bg-surface-dark">
      <Text className="text-[10px] font-bold tracking-[1.1px] text-muted-light dark:text-muted-dark">VALEURS NUTRITIONNELLES</Text>
      <View className="mt-4 min-h-[82px] flex-row items-center justify-between rounded-[17px] bg-canvas-light px-4 py-3 dark:bg-canvas-dark">
        <Text className="text-xs font-semibold text-muted-light dark:text-muted-dark">Calories</Text>
        {analysis?.estimatedCalories != null ? <Text className="text-[30px] font-bold text-ink-light dark:text-ink-dark">{analysis.estimatedCalories} kcal</Text> : <ScanSkeleton className="h-10 w-28" />}
      </View>
      <View className="mt-3 flex-row gap-2">
        {[['Protéines', macros?.protein], ['Glucides', macros?.carbohydrates], ['Lipides', macros?.fat]].map(([label, value]) => (
          <View key={label} className="min-h-[82px] flex-1 rounded-[17px] bg-canvas-light p-3 dark:bg-canvas-dark">
            <Text className="text-[10px] font-bold text-muted-light dark:text-muted-dark">{label}</Text>
            {typeof value === "number" ? <Text className="mt-3 text-lg font-bold text-ink-light dark:text-ink-dark">{value} g</Text> : <ScanSkeleton className="mt-3 h-7 w-full" />}
          </View>
        ))}
      </View>
    </View>
  );
}

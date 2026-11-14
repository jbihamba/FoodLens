import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/food/BrandMark';
import { FoodButton } from '@/components/food/FoodButton';
import { StyledImage } from '@/components/nativewind-interop';
import { useScanSession } from '@/stores/scan-session';

export default function ResultScreen() {
  const { scan, clearScan } = useScanSession();

  const startNewScan = () => {
    clearScan();
    router.replace('/scanner');
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView
        contentContainerClassName="mx-auto w-full max-w-[560px] self-center px-6 pb-[34px]"
        showsVerticalScrollIndicator={false}>
        <View className="min-h-[58px] flex-row items-center justify-between">
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center">
              <Text className="-mt-1 text-[37px] leading-10 text-ink-light dark:text-ink-dark">
                ‹
              </Text>
            </Pressable>
          </Link>
          <View className="flex-row items-center gap-2">
            <BrandMark size={34} />
            <Text className="text-base font-bold text-ink-light dark:text-ink-dark">
              FoodLens
            </Text>
          </View>
          <View className="w-10" />
        </View>

        {!scan ? (
          <View className="min-h-[430px] flex-1 items-center justify-center">
            <Text className="mt-[9px] text-center text-[29px] font-bold leading-[35px] tracking-[-0.7px] text-ink-light dark:text-ink-dark">
              No meal to show yet
            </Text>
            <Text className="mt-[7px] text-center text-[13px] leading-5 text-muted-light dark:text-muted-dark">
              Scan a meal to see its estimate here.
            </Text>
            <Link href="/scanner" asChild>
              <FoodButton label="Scan a meal" trailing="→" className="mt-[22px] self-stretch" />
            </Link>
          </View>
        ) : (
          <>
            <View className="pb-[17px] pt-5">
              <Text className="text-[10px] font-bold tracking-[1.3px] text-brand-primary">
                YOUR MEAL, AT A GLANCE
              </Text>
              <Text className="mt-[9px] text-[29px] font-bold leading-[35px] tracking-[-0.7px] text-ink-light dark:text-ink-dark">
                {scan.analysis.foodName}
              </Text>
            </View>

            <View className="h-[220px] overflow-hidden rounded-[23px]">
              <StyledImage
                source={{ uri: scan.imageUri }}
                contentFit="cover"
                className="h-full w-full"
              />
              <View className="absolute bottom-[13px] left-[13px] rounded-[13px] bg-[#202820CC] px-[11px] py-[7px]">
                <Text className="text-[9px] font-bold tracking-[1px] text-white">
                  FOODLENS ESTIMATE
                </Text>
              </View>
            </View>

            <View className="mt-[15px] rounded-[21px] border-[0.5px] border-selected-light bg-surface-light p-[19px] dark:border-selected-dark dark:bg-surface-dark">
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-bold tracking-[1.2px] text-muted-light dark:text-muted-dark">
                  ESTIMATED ENERGY
                </Text>
                <View className="rounded-[10px] bg-brand-secondary px-[9px] py-[5px]">
                  <Text className="text-[10px] font-bold text-brand-primary">kcal</Text>
                </View>
              </View>
              <View className="mt-[3px] flex-row items-baseline gap-2">
                <Text className="text-[48px] font-bold leading-[56px] tracking-[-2px] text-ink-light dark:text-ink-dark">
                  {scan.analysis.estimatedCalories?.toLocaleString() ?? '—'}
                </Text>
                <Text className="text-[15px] font-semibold text-muted-light dark:text-muted-dark">
                  kcal
                </Text>
              </View>
              <Text className="text-xs leading-[18px] text-muted-light dark:text-muted-dark">
                {scan.analysis.estimatedCalories === null
                  ? 'Not enough visual detail for a calorie estimate.'
                  : 'An approximate estimate for the meal shown.'}
              </Text>
              {scan.analysis.portionSize ? (
                <View className="mt-4 flex-row items-center justify-between border-t-[0.5px] border-brand-border pt-[13px]">
                  <Text className="text-[10px] font-bold tracking-[1px] text-muted-light dark:text-muted-dark">
                    ESTIMATED PORTION
                  </Text>
                  <Text className="text-sm font-bold text-ink-light dark:text-ink-dark">
                    {scan.analysis.portionSize}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="pt-6">
              <Text className="text-[17px] font-bold leading-[23px] text-ink-light dark:text-ink-dark">
                What we see
              </Text>
              <Text className="mt-[7px] text-[13px] leading-5 text-muted-light dark:text-muted-dark">
                {scan.analysis.description}
              </Text>
              {scan.analysis.confidence !== null ? (
                <View className="mt-3 self-start flex-row items-center gap-[6px] rounded-[14px] bg-brand-secondary px-[10px] py-[6px]">
                  <View className="h-[6px] w-[6px] rounded-full bg-brand-primary" />
                  <Text className="text-[11px] font-semibold text-muted-light dark:text-muted-dark">
                    Visual match · {Math.round(scan.analysis.confidence * 100)}%
                  </Text>
                </View>
              ) : null}
            </View>

            {scan.analysis.ingredients.length > 0 ? (
              <View className="pt-[23px]">
                <Text className="text-[17px] font-bold leading-[23px] text-ink-light dark:text-ink-dark">
                  Main ingredients
                </Text>
                <View className="mt-[11px] flex-row flex-wrap gap-2">
                  {scan.analysis.ingredients.map((ingredient) => (
                    <View
                      key={ingredient}
                      className="rounded-[15px] bg-brand-secondary px-3 py-2">
                      <Text className="text-xs font-semibold text-brand-primary">
                        {ingredient}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View className="mt-6 flex-row items-start gap-[10px] rounded-[15px] bg-[#F4EBDD] p-[14px]">
              <Text className="h-[19px] w-[19px] overflow-hidden rounded-full bg-[#E9D1AF] text-center text-xs font-bold leading-[19px] text-[#78572F]">
                i
              </Text>
              <Text className="flex-1 text-[11px] leading-[17px] text-[#705C42]">
                Calories are estimates. Actual nutrition can vary with portion size, ingredients,
                and preparation methods.
              </Text>
            </View>

            <View className="mt-[22px] gap-[10px]">
              <FoodButton label="Scan another meal" trailing="→" onPress={startNewScan} />
              <Link href="/" asChild>
                <FoodButton label="Back to home" variant="outline" />
              </Link>
            </View>
          </>
        )}
        <View className="mt-7 flex-row items-center justify-center gap-[9px] border-t-[0.5px] border-brand-border pt-[17px]">
          <BrandMark size={26} />
          <Text className="text-[11px] text-muted-light dark:text-muted-dark">
            A helpful estimate, never a diagnosis.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

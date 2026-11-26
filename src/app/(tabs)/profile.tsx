import { router } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/food/BrandMark";
import { Pressable, Text } from "@/components/LocalizedText";
import { AppCard } from "@/components/ui/AppCard";
import { Badge } from "@/components/ui/Badge";
import { ChevronRightIcon } from "@/components/ui/Icons";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { theme } from "@/constants/theme";
import { useCalorieGoal } from "@/hooks/useCalorieGoal";
import type { UserFocus } from "@/services/appSettings";
import { useAppSettings } from "@/stores/app-settings";

const focusOptions: {
  value: UserFocus;
  label: string;
  description: string;
}[] = [
  {
    value: "nutrition",
    label: "Nutrition",
    description: "Priorité au scan & repas",
  },
  {
    value: "balanced",
    label: "Équilibre",
    description: "Nutrition + Fitness",
  },
  {
    value: "fitness",
    label: "Fitness",
    description: "Priorité aux séances",
  },
];

export default function ProfileScreen() {
  const { settings, setFocus, resolvedColorScheme } = useAppSettings();
  const { profile, result, isManualGoal, isLoading } = useCalorieGoal();
  const isDark = resolvedColorScheme === "dark";
  const mutedColor = isDark ? theme.colors.mutedDark : theme.colors.mutedLight;

  const actions = [
    { label: "Réglages et préférences", path: "/settings" },
    { label: "Objectif calorique", path: "/goal" },
    { label: "Calendrier alimentaire", path: "/calendar" },
    { label: "Historique sportif", path: "/workout-history" },
  ] as const;

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-canvas-light dark:bg-canvas-dark"
    >
      <ScrollView
        contentContainerClassName="mx-auto w-full max-w-[560px] px-5 pb-10 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Profil" />

        <AppCard variant="elevated" className="mt-5 items-center py-6">
          <BrandMark size={44} />
          <Text className="mt-3 text-[19px] font-bold text-ink-light dark:text-ink-dark">
            {settings.profile.displayName || "Mon profil"}
          </Text>
          <Text className="mt-1 text-center text-[12px] text-muted-light dark:text-muted-dark">
            {settings.profile.profileInfo ||
              "FoodLens · données enregistrées sur cet appareil"}
          </Text>
        </AppCard>

        {/* Priorité personnelle */}
        <AppCard variant="default" className="mt-4">
          <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-muted-light dark:text-muted-dark">
            Mon focus
          </Text>
          <View className="mt-3 flex-row gap-2">
            {focusOptions.map((option) => {
              const selected = settings.focus === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => void setFocus(option.value)}
                  className={`flex-1 items-center rounded-[14px] border px-2 py-2.5 ${
                    selected
                      ? "border-brand-primary bg-brand-secondary dark:border-[#8CC0A0] dark:bg-selected-dark"
                      : "border-brand-border bg-canvas-light dark:border-selected-dark dark:bg-canvas-dark"
                  }`}
                >
                  <Text
                    className={`text-[13px] font-bold ${
                      selected
                        ? "text-brand-primary dark:text-[#8CC0A0]"
                        : "text-ink-light dark:text-ink-dark"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        {/* Section Mon profil et mon objectif */}
        <AppCard variant="default" className="mt-4">
          <Text className="mb-3 text-[11px] font-bold uppercase tracking-[0.8px] text-muted-light dark:text-muted-dark">
            Objectif nutritionnel
          </Text>
          {isLoading ? (
            <ActivityIndicator color="#245C45" />
          ) : profile && result ? (
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted-light dark:text-muted-dark">
                  Objectif calorique
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[15px] font-bold text-brand-primary dark:text-[#8CC0A0]">
                    {result.target} kcal
                  </Text>
                  {isManualGoal ? (
                    <Badge label="Personnalisé" tone="nutrition" />
                  ) : null}
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted-light dark:text-muted-dark">
                  Métabolisme de base (BMR)
                </Text>
                <Text className="text-[13px] text-ink-light dark:text-ink-dark">
                  {Math.round(result.bmr)} kcal
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted-light dark:text-muted-dark">
                  Dépense totale (TDEE)
                </Text>
                <Text className="text-[13px] text-ink-light dark:text-ink-dark">
                  {Math.round(result.tdee)} kcal
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recalculer mon objectif calorique"
                onPress={() => router.push("/calorie-goal-wizard")}
                className="mt-2 min-h-11 items-center justify-center rounded-[14px] border border-brand-border dark:border-selected-dark"
              >
                <Text className="text-[13px] font-semibold text-brand-primary dark:text-[#8CC0A0]">
                  Recalculer mon objectif
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Calculer mon objectif calorique"
              onPress={() => router.push("/calorie-goal-wizard")}
              className="min-h-12 flex-row items-center justify-between"
            >
              <Text className="text-[14px] font-semibold text-ink-light dark:text-ink-dark">
                Calculer mon objectif calorique
              </Text>
              <ChevronRightIcon size={18} color="#245C45" />
            </Pressable>
          )}
        </AppCard>

        <View className="mt-4 gap-2">
          {actions.map((action) => (
            <Pressable
              key={action.path}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => router.push(action.path)}
              className="min-h-14 flex-row items-center justify-between rounded-[18px] border border-brand-border bg-surface-light px-4 dark:border-selected-dark dark:bg-surface-dark"
            >
              <Text className="text-[14px] font-semibold text-ink-light dark:text-ink-dark">
                {action.label}
              </Text>
              <ChevronRightIcon size={18} color={mutedColor} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

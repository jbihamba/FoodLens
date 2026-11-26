import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, Text } from "@/components/LocalizedText";
import {
  FitnessIcon,
  HomeIcon,
  NutritionIcon,
  ProfileIcon,
  ProgressIcon,
} from "@/components/ui/Icons";
import { theme } from "@/constants/theme";
import { useAppSettings } from "@/stores/app-settings";

const tabItems = [
  { route: "index", label: "Accueil", icon: HomeIcon, tone: "brand" },
  { route: "journal", label: "Nutrition", icon: NutritionIcon, tone: "brand" },
  { route: "fitness", label: "Fitness", icon: FitnessIcon, tone: "fitness" },
  { route: "stats", label: "Progression", icon: ProgressIcon, tone: "brand" },
  { route: "profile", label: "Profil", icon: ProfileIcon, tone: "brand" },
] as const;

type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

function BottomBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { resolvedColorScheme } = useAppSettings();
  const isDark = resolvedColorScheme === "dark";
  const inactiveColor = isDark
    ? theme.colors.mutedDark
    : theme.colors.mutedLight;

  return (
    <View
      className="border-t border-brand-border bg-surface-light dark:border-selected-dark dark:bg-surface-dark"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="h-[64px] flex-row items-center px-1">
        {tabItems.map((item) => {
          const routeIndex = state.routes.findIndex(
            (route) => route.name === item.route,
          );
          if (routeIndex === -1) return null;

          const isSelected = state.index === routeIndex;
          const activeColor =
            item.tone === "fitness"
              ? isDark
                ? theme.colors.fitnessDark
                : theme.colors.fitness
              : isDark
                ? theme.colors.accentDark
                : theme.colors.accent;
          const color = isSelected ? activeColor : inactiveColor;
          const IconComponent = item.icon;

          return (
            <Pressable
              key={item.route}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() =>
                !isSelected && navigateToTab(state.routes[routeIndex].key)
              }
              className="min-h-[52px] flex-1 items-center justify-center gap-1"
            >
              <View
                className={`items-center justify-center rounded-full px-3 py-1 ${
                  isSelected
                    ? item.tone === "fitness"
                      ? "bg-fitness-softLight dark:bg-fitness-softDark"
                      : "bg-brand-secondary dark:bg-selected-dark"
                    : ""
                }`}
              >
                <IconComponent
                  size={20}
                  color={color}
                  strokeWidth={isSelected ? 2.3 : 1.9}
                />
              </View>
              <Text
                style={{ color }}
                numberOfLines={1}
                className={`text-[10px] ${isSelected ? "font-bold" : "font-medium"}`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { resolvedColorScheme } = useAppSettings();
  return (
    <Tabs
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor:
            resolvedColorScheme === "dark"
              ? theme.colors.backgroundDark
              : theme.colors.backgroundLight,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="journal" options={{ title: "Nutrition" }} />
      <Tabs.Screen name="fitness" options={{ title: "Fitness" }} />
      <Tabs.Screen name="stats" options={{ title: "Progression" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}

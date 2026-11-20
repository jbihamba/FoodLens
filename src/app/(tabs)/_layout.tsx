import { Tabs, router } from 'expo-router';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable, Text } from '@/components/LocalizedText';
import { theme } from '@/constants/theme';
import { useAppSettings } from '@/stores/app-settings';

const tabItems = [
  { route: 'index', label: 'Accueil', icon: '⌂' },
  { route: 'journal', label: 'Journal', icon: '▤' },
  { route: 'scanner', label: 'Scanner', icon: '' },
  { route: 'stats', label: 'Stats', icon: '◔' },
  { route: 'profile', label: 'Profil', icon: '○' },
] as const;

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

function BottomBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { resolvedColorScheme } = useAppSettings();
  const inactiveColor =
    resolvedColorScheme === 'dark' ? theme.colors.mutedDark : theme.colors.mutedLight;

  return (
    <View
      className="border-t border-selected-light bg-surface-light dark:border-selected-dark dark:bg-surface-dark"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      <View className="h-[68px] flex-row items-center">
        {tabItems.map((item) => {
          if (item.route === 'scanner') {
            return (
              <View key={item.route} className="h-full flex-1 items-center">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir le scanner"
                  accessibilityHint="Ouvre la caméra en plein écran"
                  onPress={() => router.push('/scanner')}
                  className="-mt-[24px] h-16 w-16 items-center justify-center rounded-full border-[4px] border-canvas-light bg-brand-primary shadow-lg dark:border-canvas-dark">
                  <View className="h-[24px] w-[30px] items-center justify-center rounded-[7px] border-[2px] border-white">
                    <View className="h-[10px] w-[10px] rounded-full border-2 border-white" />
                    <View className="absolute -top-[5px] left-[6px] h-[4px] w-[9px] rounded-t-sm bg-white" />
                  </View>
                </Pressable>
              </View>
            );
          }

          const routeIndex = state.routes.findIndex((route) => route.name === item.route);
          const isSelected = state.index === routeIndex;
          const color = isSelected
            ? resolvedColorScheme === 'dark'
              ? theme.colors.accentDark
              : theme.colors.accent
            : inactiveColor;

          return (
            <Pressable
              key={item.route}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => !isSelected && navigateToTab(state.routes[routeIndex].key)}
              className="min-h-[56px] flex-1 items-center justify-center gap-1">
              <Text style={{ color }} className="text-[22px] leading-[24px]">
                {item.icon}
              </Text>
              <Text
                style={{ color }}
                className={`text-[10px] ${isSelected ? 'font-bold' : 'font-medium'}`}>
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
            resolvedColorScheme === 'dark'
              ? theme.colors.backgroundDark
              : theme.colors.backgroundLight,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}

import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/food/BrandMark';
import { Pressable, Text } from '@/components/LocalizedText';
import { useAppSettings } from '@/stores/app-settings';

export default function ProfileScreen() {
  const { settings } = useAppSettings();
  const actions = [
    { label: 'Réglages et préférences', path: '/settings' },
    { label: 'Objectif calorique', path: '/goal' },
    { label: 'Calendrier alimentaire', path: '/calendar' },
  ] as const;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-[28px] font-extrabold text-ink-light dark:text-ink-dark">Profil</Text>
        <View className="mt-5 items-center rounded-[22px] bg-surface-light p-6 dark:bg-surface-dark">
          <BrandMark size={44} />
          <Text className="mt-3 text-[19px] font-bold text-ink-light dark:text-ink-dark">
            {settings.profile.displayName || 'Mon profil'}
          </Text>
          <Text className="mt-1 text-[12px] text-muted-light dark:text-muted-dark">
            {settings.profile.profileInfo || 'FoodLens · données enregistrées sur cet appareil'}
          </Text>
        </View>
        <View className="mt-5 gap-2">
          {actions.map((action) => (
            <Pressable
              key={action.path}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => router.push(action.path)}
              className="min-h-14 flex-row items-center justify-between rounded-[17px] bg-surface-light px-4 dark:bg-surface-dark">
              <Text className="text-[14px] font-semibold text-ink-light dark:text-ink-dark">
                {action.label}
              </Text>
              <Text className="text-[18px] text-muted-light dark:text-muted-dark">›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Platform, useColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { initializeCalorieDatabase } from '@/services/calorieTracking';
import { DailyCaloriesProvider } from '@/stores/daily-calories';
import { ScanSessionProvider } from '@/stores/scan-session';

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    if (Platform.OS === 'web' && systemColorScheme) {
      setColorScheme(systemColorScheme);
    }
  }, [setColorScheme, systemColorScheme]);

  return (
    <SQLiteProvider databaseName="foodlens.db" onInit={initializeCalorieDatabase}>
      <ScanSessionProvider>
        <DailyCaloriesProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </DailyCaloriesProvider>
      </ScanSessionProvider>
    </SQLiteProvider>
  );
}

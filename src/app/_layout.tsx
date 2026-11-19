import '../global.css';

import { SQLiteProvider } from 'expo-sqlite';

import { initializeCalorieDatabase } from '@/services/calorieTracking';
import { AppSettingsProvider } from '@/stores/app-settings';
import { DailyCaloriesProvider } from '@/stores/daily-calories';
import { ScanSessionProvider } from '@/stores/scan-session';
import { OnboardingGate } from '@/components/OnboardingGate';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="foodlens.db" onInit={initializeCalorieDatabase}>
      <AppSettingsProvider>
        <ScanSessionProvider>
          <DailyCaloriesProvider>
            <OnboardingGate />
          </DailyCaloriesProvider>
        </ScanSessionProvider>
      </AppSettingsProvider>
    </SQLiteProvider>
  );
}

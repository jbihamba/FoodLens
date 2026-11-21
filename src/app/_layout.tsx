import "../global.css";

import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initializeCalorieDatabase } from "@/services/calorieTracking";
import { AppSettingsProvider } from "@/stores/app-settings";
import { DailyCaloriesProvider } from "@/stores/daily-calories";
import { ScanSessionProvider } from "@/stores/scan-session";
import { TipsProvider } from "@/stores/tips";
import { OnboardingGate } from "@/components/OnboardingGate";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider
        databaseName="foodlens.db"
        onInit={initializeCalorieDatabase}
      >
        <AppSettingsProvider>
          <TipsProvider>
            <ScanSessionProvider>
              <DailyCaloriesProvider>
                <OnboardingGate />
              </DailyCaloriesProvider>
            </ScanSessionProvider>
          </TipsProvider>
        </AppSettingsProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

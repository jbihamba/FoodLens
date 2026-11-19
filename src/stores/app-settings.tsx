import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import {
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  saveLanguagePreference,
  saveMeasurementUnit,
  saveThemePreference,
  saveUserProfile,
  type AppSettings,
  type MeasurementUnit,
  type ThemePreference,
  type UserProfile,
} from '@/services/appSettings';
import type { AppLanguage } from '@/i18n';

interface AppSettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  loadError: string | null;
  version: string;
  resolvedColorScheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setUnits: (units: MeasurementUnit) => Promise<void>;
  setProfile: (profile: UserProfile) => Promise<void>;
  resetProfile: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const systemColorScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [settings, setSettings] = useState(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getAppSettings(db)
      .then((storedSettings) => {
        if (isCurrent) {
          setSettings(storedSettings);
          setLoadError(null);
        }
      })
      .catch((cause: unknown) => {
        if (isCurrent) {
          setLoadError(
            cause instanceof Error ? cause.message : 'Could not load your preferences.',
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [db]);

  useEffect(() => {
    setColorScheme(settings.theme);
  }, [settings.theme, setColorScheme]);

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      await saveThemePreference(db, theme);
      setSettings((current) => ({ ...current, theme }));
    },
    [db],
  );
  const setLanguage = useCallback(
    async (language: AppLanguage) => {
      await saveLanguagePreference(db, language);
      setSettings((current) => ({ ...current, language }));
    },
    [db],
  );
  const setUnits = useCallback(
    async (units: MeasurementUnit) => {
      await saveMeasurementUnit(db, units);
      setSettings((current) => ({ ...current, units }));
    },
    [db],
  );
  const setProfile = useCallback(
    async (profile: UserProfile) => {
      await saveUserProfile(db, profile);
      setSettings((current) => ({ ...current, profile }));
    },
    [db],
  );
  const resetProfile = useCallback(() => {
    setSettings((current) => ({ ...current, profile: DEFAULT_APP_SETTINGS.profile }));
  }, []);

  const resolvedColorScheme =
    settings.theme === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : settings.theme;

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      loadError,
      version: Constants.expoConfig?.version ?? '1.0.0',
      resolvedColorScheme,
      setTheme,
      setLanguage,
      setUnits,
      setProfile,
      resetProfile,
    }),
    [
      settings,
      isLoading,
      loadError,
      resolvedColorScheme,
      setTheme,
      setLanguage,
      setUnits,
      setProfile,
      resetProfile,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      <StatusBar style={resolvedColorScheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const value = useContext(AppSettingsContext);
  if (!value) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return value;
}

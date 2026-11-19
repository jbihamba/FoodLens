import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSQLiteContext } from 'expo-sqlite';

import { BrandMark } from '@/components/food/BrandMark';
import { Pressable, Text, TextInput } from '@/components/LocalizedText';
import { clearPersonalData, getLocalDataSummary } from '@/services/appSettings';
import type { MeasurementUnit, ThemePreference, UserProfile } from '@/services/appSettings';
import { useAppSettings } from '@/stores/app-settings';
import { useDailyCalories } from '@/stores/daily-calories';

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <View className="mb-[11px] mt-[25px] flex-row items-center gap-[10px]">
      <View className="h-[32px] w-[32px] items-center justify-center rounded-[11px] bg-brand-secondary dark:bg-selected-dark">
        <Text aria-hidden className="text-sm font-bold text-brand-primary dark:text-[#A8C8B2]">
          {icon}
        </Text>
      </View>
      <Text className="text-[16px] font-bold text-ink-light dark:text-ink-dark">
        {title}
      </Text>
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[43px] flex-1 items-center justify-center rounded-[14px] px-2 disabled:opacity-60 ${
        selected ? 'bg-brand-primary' : 'bg-canvas-light dark:bg-canvas-dark'
      }`}>
      <Text
        className={`text-xs font-bold ${
          selected ? 'text-white' : 'text-muted-light dark:text-muted-dark'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProfileEditor({
  profile,
  disabled,
  saving,
  onSave,
}: {
  profile: UserProfile;
  disabled: boolean;
  saving: boolean;
  onSave: (profile: UserProfile) => void;
}) {
  const [draft, setDraft] = useState(profile);

  return (
    <View className="gap-[15px] rounded-[20px] border-[0.5px] border-selected-light bg-surface-light p-4 dark:border-selected-dark dark:bg-surface-dark">
      <View>
        <Text className="mb-2 text-xs font-bold text-ink-light dark:text-ink-dark">
          Display name
        </Text>
        <TextInput
          accessibilityLabel="Your name"
          className="min-h-[48px] rounded-[13px] border border-brand-border px-[13px] text-sm text-ink-light dark:border-selected-dark dark:text-ink-dark"
          value={draft.displayName}
          onChangeText={(displayName) => setDraft((current) => ({ ...current, displayName }))}
          placeholder="Your name"
          placeholderTextColor="#68736B"
          maxLength={60}
          editable={!saving && !disabled}
          returnKeyType="next"
        />
      </View>
      <View>
        <Text className="mb-2 text-xs font-bold text-ink-light dark:text-ink-dark">
          Profile information
        </Text>
        <TextInput
          accessibilityLabel="Your profile information"
          className="min-h-[86px] rounded-[13px] border border-brand-border px-[13px] py-3 text-sm text-ink-light dark:border-selected-dark dark:text-ink-dark"
          value={draft.profileInfo}
          onChangeText={(profileInfo) => setDraft((current) => ({ ...current, profileInfo }))}
          placeholder="Add a few details about yourself"
          placeholderTextColor="#68736B"
          maxLength={240}
          multiline
          textAlignVertical="top"
          editable={!saving && !disabled}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={saving || disabled}
        onPress={() =>
          onSave({
            displayName: draft.displayName.trim(),
            profileInfo: draft.profileInfo.trim(),
          })
        }
        className="min-h-[48px] items-center justify-center rounded-[14px] bg-brand-primary disabled:opacity-60">
        <Text className="text-sm font-bold text-white">
          {saving ? 'Saving…' : 'Save profile'}
        </Text>
      </Pressable>
      <Text className="text-[11px] text-muted-light dark:text-muted-dark">
        Profile details are stored only on this device.
      </Text>
    </View>
  );
}

function formatBytes(bytes: number, language: 'en' | 'fr') {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / 1024;
  return `~${kilobytes.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
    maximumFractionDigits: 1,
  })} KB`;
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const {
    settings,
    isLoading,
    loadError,
    version,
    setTheme,
    setLanguage,
    setUnits,
    setProfile,
    resetProfile,
  } = useAppSettings();
  const { refresh } = useDailyCalories();
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [estimatedBytes, setEstimatedBytes] = useState<number | null>(null);
  const [isRefreshingStorage, setIsRefreshingStorage] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getLocalDataSummary(db)
      .then((summary) => {
        if (isCurrent) {
          setEntryCount(summary?.entry_count ?? 0);
          setEstimatedBytes(summary?.estimated_bytes ?? 0);
        }
      })
      .catch((cause: unknown) => {
        if (isCurrent) {
          setError(cause instanceof Error ? cause.message : 'Could not read local storage.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsRefreshingStorage(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [db]);

  const saveProfile = async (profile: UserProfile) => {
    setError(null);
    setNotice(null);
    setIsSavingProfile(true);
    try {
      await setProfile({
        displayName: profile.displayName,
        profileInfo: profile.profileInfo,
      });
      setNotice('Profile saved on this device.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updateSetting = async (update: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    try {
      await update();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your preference.');
    }
  };

  const clearData = async () => {
    if (isClearingData) {
      return;
    }
    setError(null);
    setNotice(null);
    setIsClearingData(true);
    try {
      await clearPersonalData(db);
      resetProfile();
      await refresh();
      const summary = await getLocalDataSummary(db);
      setEntryCount(summary?.entry_count ?? 0);
      setEstimatedBytes(summary?.estimated_bytes ?? 0);
      setShowClearConfirmation(false);
      setNotice('Your meals, daily goal, and profile were cleared.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not clear local data.');
    } finally {
      setIsClearingData(false);
    }
  };

  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];
  const measurementUnits: { value: MeasurementUnit; label: string }[] = [
    { value: 'metric', label: 'Metric' },
    { value: 'imperial', label: 'Imperial' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="mx-auto w-full max-w-[560px] px-5 pb-10 sm:px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="min-h-[64px] flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
              <Text className="text-[22px] text-ink-light dark:text-ink-dark">‹</Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              <BrandMark size={34} />
              <Text className="text-[16px] font-bold text-ink-light dark:text-ink-dark">
                Settings
              </Text>
            </View>
            <View className="w-11" />
          </View>

          <Animated.View entering={FadeInDown.duration(240)} className="pt-5">
            <Text className="text-[10px] font-bold tracking-[1.2px] text-brand-primary dark:text-[#A8C8B2]">
              FOODLENS
            </Text>
            <Text className="mt-2 text-[31px] font-bold leading-[37px] tracking-[-0.8px] text-ink-light dark:text-ink-dark">
              Settings
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-muted-light dark:text-muted-dark">
              Personalize FoodLens to make it feel like yours.
            </Text>

            <SectionHeading icon="◐" title="Appearance" />
            <View className="rounded-[20px] border-[0.5px] border-selected-light bg-surface-light p-2 dark:border-selected-dark dark:bg-surface-dark">
              <View className="flex-row gap-1">
                {themes.map((theme) => (
                  <Choice
                    key={theme.value}
                    label={theme.label}
                    selected={settings.theme === theme.value}
                    disabled={isLoading}
                    onPress={() => void updateSetting(() => setTheme(theme.value))}
                  />
                ))}
              </View>
            </View>

            <SectionHeading icon="文" title="Language" />
            <View className="rounded-[20px] border-[0.5px] border-selected-light bg-surface-light p-2 dark:border-selected-dark dark:bg-surface-dark">
              <View className="flex-row gap-1">
                <Choice
                  label="English"
                  selected={settings.language === 'en'}
                  disabled={isLoading}
                  onPress={() => void updateSetting(() => setLanguage('en'))}
                />
                <Choice
                  label="French"
                  selected={settings.language === 'fr'}
                  disabled={isLoading}
                  onPress={() => void updateSetting(() => setLanguage('fr'))}
                />
              </View>
            </View>

            <SectionHeading icon="⇄" title="Measurement units" />
            <View className="rounded-[20px] border-[0.5px] border-selected-light bg-surface-light p-2 dark:border-selected-dark dark:bg-surface-dark">
              <View className="flex-row gap-1">
                {measurementUnits.map((unit) => (
                  <Choice
                    key={unit.value}
                    label={unit.label}
                    selected={settings.units === unit.value}
                    disabled={isLoading}
                    onPress={() => void updateSetting(() => setUnits(unit.value))}
                  />
                ))}
              </View>
              <Text className="px-3 pb-2 pt-3 text-[11px] leading-[17px] text-muted-light dark:text-muted-dark">
                Nutrition is always stored and shown in kcal and grams. This preference applies to other measurements when available.
              </Text>
            </View>

            <SectionHeading icon="◎" title="Profile" />
            <ProfileEditor
              key={`${settings.profile.displayName}:${settings.profile.profileInfo}`}
              profile={settings.profile}
              disabled={isLoading}
              saving={isSavingProfile}
              onSave={(profile) => void saveProfile(profile)}
            />

            <SectionHeading icon="▤" title="Data management" />
            <View className="rounded-[20px] border-[0.5px] border-selected-light bg-surface-light p-4 dark:border-selected-dark dark:bg-surface-dark">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-bold text-ink-light dark:text-ink-dark">
                    Locally stored meals
                  </Text>
                  <Text className="mt-1 text-[11px] leading-4 text-muted-light dark:text-muted-dark">
                    {isRefreshingStorage || entryCount === null
                      ? 'Calculating local storage…'
                      : `${entryCount} ${entryCount === 1 ? 'meal' : 'meals'} · ${formatBytes(estimatedBytes ?? 0, settings.language)}`}
                  </Text>
                </View>
                <Text aria-hidden className="text-[20px] text-brand-primary dark:text-[#A8C8B2]">
                  ⌂
                </Text>
              </View>
              <Text className="mt-2 text-[10px] leading-[15px] text-muted-light dark:text-muted-dark">
                Estimated from saved meal records; image files and database overhead are not included.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={isLoading || isClearingData}
                onPress={() => setShowClearConfirmation(true)}
                className="mt-4 min-h-[46px] items-center justify-center rounded-[14px] border border-[#E8C8C4] disabled:opacity-60 dark:border-[#70443F]">
                <Text className="text-sm font-bold text-[#A53F35] dark:text-[#F2A097]">
                  Clear local data
                </Text>
              </Pressable>
            </View>

            <SectionHeading icon="i" title="About FoodLens" />
            <View className="rounded-[20px] border-[0.5px] border-selected-light bg-surface-light p-4 dark:border-selected-dark dark:bg-surface-dark">
              <View className="flex-row items-center gap-3">
                <BrandMark size={44} />
                <View>
                  <Text className="text-[16px] font-bold text-ink-light dark:text-ink-dark">
                    FoodLens
                  </Text>
                  <Text className="mt-1 text-[11px] text-muted-light dark:text-muted-dark">
                    Version {version}
                  </Text>
                </View>
              </View>
              <Text className="mt-4 text-[12px] leading-[18px] text-muted-light dark:text-muted-dark">
                A mindful meal companion that helps you explore food and nutrition.
              </Text>
              <View className="my-4 h-px bg-brand-border dark:bg-selected-dark" />
              <Text className="text-xs font-bold text-ink-light dark:text-ink-dark">
                Privacy
              </Text>
              <Text className="mt-1 text-[11px] leading-[17px] text-muted-light dark:text-muted-dark">
                Your food diary and profile stay on this device. When you scan a meal, its photo is sent to the configured analysis service to create an estimate, which may forward it to Google.
              </Text>
              <Text className="mt-3 text-xs font-bold text-ink-light dark:text-ink-dark">
                Credits
              </Text>
              <Text className="mt-1 text-[11px] leading-[17px] text-muted-light dark:text-muted-dark">
                Made with Expo, React Native, and NativeWind.
              </Text>
            </View>

            {loadError || error ? (
              <Text accessibilityRole="alert" className="mt-4 text-xs leading-[18px] text-[#A53F35]">
                {error ?? loadError}
              </Text>
            ) : null}
            {notice ? (
              <Text accessibilityRole="alert" className="mt-4 text-xs leading-[18px] text-brand-primary dark:text-[#A8C8B2]">
                {notice}
              </Text>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="fade"
        visible={showClearConfirmation}
        onRequestClose={() => {
          if (!isClearingData) {
            setShowClearConfirmation(false);
          }
        }}>
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full max-w-[390px] rounded-[24px] bg-surface-light p-5 dark:bg-surface-dark">
            <Text className="text-[19px] font-bold text-ink-light dark:text-ink-dark">
              Clear local data?
            </Text>
            <Text className="mt-2 text-[13px] leading-5 text-muted-light dark:text-muted-dark">
              This permanently removes your meal history and profile, and resets your daily goal. Your language, appearance, and onboarding settings will stay.
            </Text>
            {error ? (
              <Text accessibilityRole="alert" className="mt-3 text-xs leading-[18px] text-[#A53F35]">
                {error}
              </Text>
            ) : null}
            <View className="mt-5 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={isClearingData}
                onPress={() => setShowClearConfirmation(false)}
                className="min-h-[48px] flex-1 items-center justify-center rounded-[15px] bg-canvas-light dark:bg-canvas-dark">
                <Text className="text-sm font-bold text-ink-light dark:text-ink-dark">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isClearingData}
                onPress={() => void clearData()}
                className="min-h-[48px] flex-1 items-center justify-center rounded-[15px] bg-[#A53F35] disabled:opacity-60">
                <Text className="text-sm font-bold text-white">
                  {isClearingData ? 'Clearing…' : 'Clear data'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

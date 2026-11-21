import type { SQLiteDatabase } from "expo-sqlite";

import { DEFAULT_DAILY_GOAL } from "@/services/calorieTracking";
import type { AppLanguage } from "@/i18n";

export type ThemePreference = "system" | "light" | "dark";
export type MeasurementUnit = "metric" | "imperial";

export interface UserProfile {
  displayName: string;
  profileInfo: string;
}

export interface AppSettings {
  theme: ThemePreference;
  language: AppLanguage;
  units: MeasurementUnit;
  profile: UserProfile;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "system",
  language: "en",
  units: "metric",
  profile: { displayName: "", profileInfo: "" },
};

const SETTING_KEYS = {
  theme: "theme_mode",
  language: "language",
  units: "measurement_unit",
  profile: "profile",
} as const;

function isTheme(value: string | undefined): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function isLanguage(value: string | undefined): value is AppLanguage {
  return value === "en" || value === "fr";
}

function isMeasurementUnit(
  value: string | undefined,
): value is MeasurementUnit {
  return value === "metric" || value === "imperial";
}

export async function getAppSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM app_preferences WHERE key IN (?, ?, ?, ?)",
    SETTING_KEYS.theme,
    SETTING_KEYS.language,
    SETTING_KEYS.units,
    SETTING_KEYS.profile,
  );
  const stored = new Map(rows.map(({ key, value }) => [key, value]));
  let profile = DEFAULT_APP_SETTINGS.profile;

  try {
    const parsed: unknown = JSON.parse(
      stored.get(SETTING_KEYS.profile) ?? "null",
    );
    if (parsed && typeof parsed === "object") {
      const candidate = parsed as Record<string, unknown>;
      profile = {
        displayName:
          typeof candidate.displayName === "string"
            ? candidate.displayName
            : "",
        profileInfo:
          typeof candidate.profileInfo === "string"
            ? candidate.profileInfo
            : "",
      };
    }
  } catch (cause) {
    console.warn(
      "[settings] Stored profile was invalid and has been ignored.",
      cause,
    );
    profile = DEFAULT_APP_SETTINGS.profile;
  }

  const theme = stored.get(SETTING_KEYS.theme);
  const language = stored.get(SETTING_KEYS.language);
  const units = stored.get(SETTING_KEYS.units);

  return {
    theme: isTheme(theme) ? theme : DEFAULT_APP_SETTINGS.theme,
    language: isLanguage(language) ? language : DEFAULT_APP_SETTINGS.language,
    units: isMeasurementUnit(units) ? units : DEFAULT_APP_SETTINGS.units,
    profile,
  };
}

export async function saveThemePreference(
  db: SQLiteDatabase,
  theme: ThemePreference,
) {
  await savePreference(db, SETTING_KEYS.theme, theme);
}

export async function saveLanguagePreference(
  db: SQLiteDatabase,
  language: AppLanguage,
) {
  await savePreference(db, SETTING_KEYS.language, language);
}

export async function saveMeasurementUnit(
  db: SQLiteDatabase,
  units: MeasurementUnit,
) {
  await savePreference(db, SETTING_KEYS.units, units);
}

export async function saveUserProfile(
  db: SQLiteDatabase,
  profile: UserProfile,
) {
  await savePreference(db, SETTING_KEYS.profile, JSON.stringify(profile));
}

async function savePreference(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    "INSERT OR REPLACE INTO app_preferences (key, value) VALUES (?, ?)",
    key,
    value,
  );
}

export async function getLocalDataSummary(db: SQLiteDatabase) {
  return db.getFirstAsync<{ entry_count: number; estimated_bytes: number }>(
    `SELECT
       COUNT(*) AS entry_count,
       COALESCE(SUM(
         length(CAST(food_name AS BLOB)) +
         length(CAST(COALESCE(meal_type, '') AS BLOB)) +
         length(CAST(COALESCE(image_uri, '') AS BLOB)) +
         length(CAST(calories AS TEXT)) +
         length(CAST(COALESCE(protein_g, 0) AS TEXT)) +
         length(CAST(COALESCE(carbs_g, 0) AS TEXT)) +
         length(CAST(COALESCE(fat_g, 0) AS TEXT)) +
         length(CAST(consumed_at AS BLOB))
       ), 0) AS estimated_bytes
     FROM food_entries`,
  );
}

export async function clearPersonalData(db: SQLiteDatabase) {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM food_entries");
    await db.runAsync(
      "DELETE FROM app_preferences WHERE key = ?",
      SETTING_KEYS.profile,
    );

    const goal = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM daily_goals ORDER BY id DESC LIMIT 1",
    );
    if (goal) {
      await db.runAsync(
        "UPDATE daily_goals SET target_calories = ?, updated_at = ? WHERE id = ?",
        DEFAULT_DAILY_GOAL,
        now,
        goal.id,
      );
    } else {
      await db.runAsync(
        "INSERT INTO daily_goals (target_calories, created_at, updated_at) VALUES (?, ?, ?)",
        DEFAULT_DAILY_GOAL,
        now,
        now,
      );
    }
  });
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  calculateCalorieGoal,
  validateManualGoal,
} from "@/services/nutrition/calorieGoal";
import type { CalorieGoalResult, UserProfile } from "@/types/profile";

const STORAGE_KEY_PROFILE = "calorie_profile_v1";
const STORAGE_KEY_MANUAL_GOAL = "calorie_manual_goal_v1";

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function loadStoredProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as UserProfile;
  } catch {
    return null;
  }
}

async function persistProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
}

async function loadStoredManualGoal(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_MANUAL_GOAL);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

async function persistManualGoal(goal: number | null): Promise<void> {
  if (goal === null) {
    await AsyncStorage.removeItem(STORAGE_KEY_MANUAL_GOAL);
  } else {
    await AsyncStorage.setItem(STORAGE_KEY_MANUAL_GOAL, String(goal));
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseCalorieGoalReturn {
  /** Profil actuellement sauvegardé, null si non configuré */
  profile: UserProfile | null;
  /** Résultat du calcul calorique, null si profil incomplet */
  result: CalorieGoalResult | null;
  /** Vrai si un objectif manuel est actif (et clairement signalé comme tel) */
  isManualGoal: boolean;
  /** Objectif manuel courant si présent */
  manualGoal: number | null;
  isLoading: boolean;
  error: string | null;
  /** Enregistre un nouveau profil et recalcule automatiquement */
  saveProfile: (profile: UserProfile) => Promise<void>;
  /**
   * Enregistre un objectif manuel.
   * Retourne un message d'erreur si la valeur est refusée (en dessous du plancher).
   */
  saveManualGoal: (
    calories: number,
  ) => Promise<{ messageFr: string; messageEn: string } | null>;
  /** Supprime l'objectif manuel et revient au calcul automatique */
  clearManualGoal: () => Promise<void>;
}

export function useCalorieGoal(): UseCalorieGoalReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [manualGoal, setManualGoal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement initial
  useEffect(() => {
    let isCurrent = true;
    Promise.all([loadStoredProfile(), loadStoredManualGoal()])
      .then(([storedProfile, storedManual]) => {
        if (!isCurrent) return;
        setProfile(storedProfile);
        setManualGoal(storedManual);
      })
      .catch((cause: unknown) => {
        if (!isCurrent) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Impossible de charger le profil calorique.",
        );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const saveProfile = useCallback(async (nextProfile: UserProfile) => {
    await persistProfile(nextProfile);
    setProfile(nextProfile);
    // Si le profil change, on conserve l'objectif manuel mais on le revalide
    // (cas où le sexe change et modifie le plancher)
  }, []);

  const saveManualGoal = useCallback(
    async (
      calories: number,
    ): Promise<{ messageFr: string; messageEn: string } | null> => {
      const sex = profile?.sex ?? "unspecified";
      const validationError = validateManualGoal(calories, sex);
      if (validationError) {
        return validationError;
      }
      await persistManualGoal(calories);
      setManualGoal(calories);
      return null;
    },
    [profile],
  );

  const clearManualGoal = useCallback(async () => {
    await persistManualGoal(null);
    setManualGoal(null);
  }, []);

  const result = useMemo<CalorieGoalResult | null>(() => {
    if (!profile) return null;
    try {
      return calculateCalorieGoal(profile, manualGoal ?? undefined);
    } catch {
      return null;
    }
  }, [profile, manualGoal]);

  return {
    profile,
    result,
    isManualGoal: manualGoal !== null,
    manualGoal,
    isLoading,
    error,
    saveProfile,
    saveManualGoal,
    clearManualGoal,
  };
}

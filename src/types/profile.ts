import type { ActivityLevel, WeightGoal } from "@/constants/nutrition";

export type Sex = "male" | "female" | "unspecified";

/**
 * Profil utilisateur utilisé pour le calcul de l'objectif calorique.
 * Toutes les mesures corporelles sont stockées en unités SI (kg, cm).
 */
export interface UserProfile {
  sex: Sex;
  age: number;
  /** Poids en kilogrammes */
  weightKg: number;
  /** Taille en centimètres */
  heightCm: number;
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
  /** Si vrai : pas de déficit proposé, TDEE affiché avec message pro */
  isPregnantOrBreastfeeding: boolean;
}

/** Résultat complet du calcul calorique */
export interface CalorieGoalResult {
  /** Métabolisme de base (kcal/jour) */
  bmr: number;
  /** Dépense totale = BMR × coefficient d'activité (kcal/jour) */
  tdee: number;
  /**
   * Objectif recommandé arrondi à la dizaine la plus proche (kcal/jour).
   * Inclut l'ajustement d'objectif de poids et le plancher de sécurité.
   */
  target: number;
  /** Vrai si le plancher de sécurité a été appliqué */
  floorApplied: boolean;
  /**
   * Messages informatifs (non alarmistes) à afficher à l'utilisateur.
   * Exemples : « estimation moins fiable », « sexe non précisé », etc.
   */
  warnings: CalorieWarning[];
}

export type CalorieWarningKey =
  | "ageUnder19"
  | "ageOver78"
  | "sexUnspecified"
  | "pregnantOrBreastfeeding"
  | "floorApplied"
  | "tdeeNearFloor"
  | "manualGoalBelowFloor";

export interface CalorieWarning {
  key: CalorieWarningKey;
  /** Message en français (langue par défaut de l'interface) */
  messageFr: string;
  /** Message en anglais */
  messageEn: string;
}

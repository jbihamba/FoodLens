/**
 * @file services/nutrition/calorieGoal.ts
 *
 * Fonctions pures de calcul calorique basées sur la formule de Mifflin-St Jeor
 * (1990, Am J Clin Nutr 51(2):241-247).
 *
 * Ces fonctions n'ont aucune dépendance vers la base de données ni vers l'UI.
 * Elles sont entièrement testables et déterministes.
 */

import {
  ACTIVITY_COEFFICIENTS,
  CALORIE_FLOOR,
  MAX_MANUAL_GOAL,
  PROFILE_BOUNDS,
  SEX_CONSTANT_UNSPECIFIED,
  WEIGHT_GOAL_ADJUSTMENTS,
  FORMULA_RELIABLE_AGE,
  type ActivityLevel,
} from "@/constants/nutrition";
import type {
  CalorieGoalResult,
  CalorieWarning,
  CalorieWarningKey,
  UserProfile,
} from "@/types/profile";

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

function makeWarning(
  key: CalorieWarningKey,
  messageFr: string,
  messageEn: string,
): CalorieWarning {
  return { key, messageFr, messageEn };
}

/** Arrondit à la dizaine la plus proche pour éviter une fausse précision. */
function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

function floorForProfile(sex: UserProfile["sex"]): number {
  if (sex === "male") return CALORIE_FLOOR.male;
  if (sex === "female") return CALORIE_FLOOR.female;
  return CALORIE_FLOOR.unspecified;
}

// ---------------------------------------------------------------------------
// Validation du profil
// ---------------------------------------------------------------------------

export type ProfileValidationError = {
  field: "age" | "weightKg" | "heightCm";
  messageFr: string;
  messageEn: string;
};

/**
 * Valide les champs du profil avant le calcul.
 * Retourne un tableau d'erreurs (vide si tout est valide).
 * Refuse les moins de 18 ans avec un message bienveillant.
 */
export function validateProfile(
  profile: Partial<UserProfile>,
): ProfileValidationError[] {
  const errors: ProfileValidationError[] = [];

  const age = profile.age;
  if (age === undefined || isNaN(age)) {
    errors.push({
      field: "age",
      messageFr: "Veuillez indiquer votre âge.",
      messageEn: "Please enter your age.",
    });
  } else if (age < 18) {
    errors.push({
      field: "age",
      messageFr:
        "FoodLens est conçu pour les adultes de 18 ans et plus. Pour les jeunes, un suivi avec un professionnel de santé est recommandé.",
      messageEn:
        "FoodLens is designed for adults aged 18 and over. For younger users, guidance from a health professional is recommended.",
    });
  } else if (age > PROFILE_BOUNDS.age.max) {
    errors.push({
      field: "age",
      messageFr: `L'âge doit être compris entre ${PROFILE_BOUNDS.age.min} et ${PROFILE_BOUNDS.age.max} ans.`,
      messageEn: `Age must be between ${PROFILE_BOUNDS.age.min} and ${PROFILE_BOUNDS.age.max}.`,
    });
  }

  const weightKg = profile.weightKg;
  if (weightKg === undefined || isNaN(weightKg)) {
    errors.push({
      field: "weightKg",
      messageFr: "Veuillez indiquer votre poids.",
      messageEn: "Please enter your weight.",
    });
  } else if (
    weightKg < PROFILE_BOUNDS.weightKg.min ||
    weightKg > PROFILE_BOUNDS.weightKg.max
  ) {
    errors.push({
      field: "weightKg",
      messageFr: `Le poids doit être compris entre ${PROFILE_BOUNDS.weightKg.min} et ${PROFILE_BOUNDS.weightKg.max} kg.`,
      messageEn: `Weight must be between ${PROFILE_BOUNDS.weightKg.min} and ${PROFILE_BOUNDS.weightKg.max} kg.`,
    });
  }

  const heightCm = profile.heightCm;
  if (heightCm === undefined || isNaN(heightCm)) {
    errors.push({
      field: "heightCm",
      messageFr: "Veuillez indiquer votre taille.",
      messageEn: "Please enter your height.",
    });
  } else if (
    heightCm < PROFILE_BOUNDS.heightCm.min ||
    heightCm > PROFILE_BOUNDS.heightCm.max
  ) {
    errors.push({
      field: "heightCm",
      messageFr: `La taille doit être comprise entre ${PROFILE_BOUNDS.heightCm.min} et ${PROFILE_BOUNDS.heightCm.max} cm.`,
      messageEn: `Height must be between ${PROFILE_BOUNDS.heightCm.min} and ${PROFILE_BOUNDS.heightCm.max} cm.`,
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Fonctions de calcul
// ---------------------------------------------------------------------------

/**
 * Calcule le métabolisme de base (BMR) selon Mifflin-St Jeor.
 *
 * Formule :
 *   BMR (homme)      = 10×poids(kg) + 6,25×taille(cm) − 5×âge + 5
 *   BMR (femme)      = 10×poids(kg) + 6,25×taille(cm) − 5×âge − 161
 *   BMR (non précisé) = 10×poids(kg) + 6,25×taille(cm) − 5×âge + SEX_CONSTANT_UNSPECIFIED
 *
 * @throws si le profil contient des valeurs invalides (validation préalable recommandée)
 */
export function calculateBmr(
  profile: Pick<UserProfile, "sex" | "age" | "weightKg" | "heightCm">,
): number {
  const { sex, age, weightKg, heightCm } = profile;

  const sexConstant =
    sex === "male" ? 5 : sex === "female" ? -161 : SEX_CONSTANT_UNSPECIFIED; // voir constante dans nutrition.ts

  return 10 * weightKg + 6.25 * heightCm - 5 * age + sexConstant;
}

/**
 * Calcule la dépense énergétique totale (TDEE).
 *
 * TDEE = BMR × coefficient d'activité
 */
export function calculateTdee(
  bmr: number,
  activityLevel: ActivityLevel,
): number {
  return bmr * ACTIVITY_COEFFICIENTS[activityLevel];
}

/**
 * Calcule l'objectif calorique quotidien complet.
 *
 * Applique dans l'ordre :
 * 1. Vérification grossesse/allaitement → pas de déficit
 * 2. Ajustement selon l'objectif de poids
 * 3. Plancher de sécurité (uniquement en mode « perdre »)
 * 4. Vérification TDEE lui-même proche du plancher (maintien)
 * 5. Warnings age / sexe
 * 6. Arrondi à la dizaine
 *
 * @param profile - Profil utilisateur complet et validé
 * @param manualGoal - Objectif manuel optionnel saisi par l'utilisateur
 */
export function calculateCalorieGoal(
  profile: UserProfile,
  manualGoal?: number,
): CalorieGoalResult {
  const warnings: CalorieWarning[] = [];

  // --- Warnings âge ---
  if (profile.age >= 18 && profile.age < FORMULA_RELIABLE_AGE.min) {
    warnings.push(
      makeWarning(
        "ageUnder19",
        `L'étude Mifflin-St Jeor couvre les 19-78 ans. Entre 18 et 19 ans, l'estimation est légèrement moins fiable.`,

        "The Mifflin-St Jeor study covers ages 19–78. Between 18 and 19, the estimate is slightly less reliable.",
      ),
    );
  }
  if (profile.age > FORMULA_RELIABLE_AGE.max) {
    warnings.push(
      makeWarning(
        "ageOver78",
        `Au-delà de 78 ans, l'estimation est indicative : la formule a été validée jusqu'à 78 ans.`,

        "Above age 78, the estimate is indicative: the formula was validated up to age 78.",
      ),
    );
  }

  // --- Warning sexe non précisé ---
  if (profile.sex === "unspecified") {
    warnings.push(
      makeWarning(
        "sexUnspecified",
        `Sexe non renseigné : une valeur intermédiaire est utilisée. L'estimation est moins précise.`,

        "Sex not specified: an intermediate value is used. The estimate is less precise.",
      ),
    );
  }

  const bmr = calculateBmr(profile);
  const tdee = calculateTdee(bmr, profile.activityLevel);
  const floor = floorForProfile(profile.sex);
  let target: number;
  let floorApplied = false;

  // --- Grossesse / allaitement ---
  if (profile.isPregnantOrBreastfeeding) {
    warnings.push(
      makeWarning(
        "pregnantOrBreastfeeding",
        `En cas de grossesse ou d'allaitement, aucun déficit calorique n'est recommandé. Consultez un professionnel de santé pour des conseils adaptés.`,

        "During pregnancy or breastfeeding, no calorie deficit is recommended. Please consult a health professional for personalised advice.",
      ),
    );
    // On affiche le TDEE, sans aucun ajustement
    target = roundToNearest10(tdee);
  } else if (manualGoal !== undefined) {
    // --- Objectif manuel ---
    if (manualGoal < floor) {
      // Refuse silencieusement et remonte au plancher (géré côté UI via validateManualGoal)
      target = floor;
      floorApplied = true;
    } else {
      target = roundToNearest10(Math.min(manualGoal, MAX_MANUAL_GOAL));
    }
  } else {
    // --- Calcul automatique ---
    const adjustment = WEIGHT_GOAL_ADJUSTMENTS[profile.weightGoal];
    const rawTarget = tdee + adjustment;

    if (profile.weightGoal === "lose" && rawTarget < floor) {
      // Plancher appliqué en mode « perdre »
      target = floor;
      floorApplied = true;
      warnings.push(
        makeWarning(
          "floorApplied",
          `Avec ce profil, appliquer un déficit de ${Math.abs(adjustment)} kcal donnerait un objectif très bas. Pour ta sécurité, l'objectif a été relevé à ${floor} kcal. Un suivi médical est recommandé pour tout régime restrictif.`,
          `With this profile, applying a ${Math.abs(adjustment)} kcal deficit would result in a very low target. For your safety, the goal has been raised to ${floor} kcal. Medical supervision is recommended for any restrictive diet.`,
        ),
      );
    } else if (profile.weightGoal === "maintain" && tdee < floor) {
      // TDEE lui-même en dessous du plancher — on ne force pas d'excédent
      target = roundToNearest10(tdee);
      warnings.push(
        makeWarning(
          "tdeeNearFloor",
          `Votre dépense estimée (${Math.round(tdee)} kcal) est proche du plancher de sécurité. Ces valeurs peuvent varier selon votre composition corporelle. Pensez à en parler à un professionnel de santé.`,
          `Your estimated expenditure (${Math.round(tdee)} kcal) is close to the safety floor. These values can vary based on body composition. Consider discussing this with a health professional.`,
        ),
      );
    } else {
      target = roundToNearest10(rawTarget);
    }
  }

  return {
    bmr,
    tdee,
    target,
    floorApplied,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Validation de l'objectif manuel
// ---------------------------------------------------------------------------

/**
 * Vérifie si un objectif manuel est acceptable.
 * Retourne un message d'erreur si invalide, null sinon.
 */
export function validateManualGoal(
  calories: number,
  sex: UserProfile["sex"],
): { messageFr: string; messageEn: string } | null {
  const floor = floorForProfile(sex);

  if (!Number.isFinite(calories) || calories <= 0) {
    return {
      messageFr: "Veuillez saisir un nombre de calories valide.",
      messageEn: "Please enter a valid calorie amount.",
    };
  }
  if (calories < floor) {
    return {
      messageFr: `Par sécurité, l'objectif ne peut pas être inférieur à ${floor} kcal/jour. Cette limite est une convention diététique commune, pas un seuil médical universel.`,
      messageEn: `For safety, the goal cannot be below ${floor} kcal/day. This limit is a common dietary convention, not a universal medical threshold.`,
    };
  }
  if (calories > MAX_MANUAL_GOAL) {
    return {
      messageFr: `L'objectif ne peut pas dépasser ${MAX_MANUAL_GOAL} kcal/jour (borne haute pour éviter les erreurs de saisie).`,
      messageEn: `The goal cannot exceed ${MAX_MANUAL_GOAL} kcal/day (upper bound to prevent input errors).`,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Conversion d'unités
// ---------------------------------------------------------------------------

/** Livre → kilogramme */
export function lbsToKg(lbs: number): number {
  return lbs * 0.45359237;
}

/** Kilogramme → livre */
export function kgToLbs(kg: number): number {
  return kg / 0.45359237;
}

/** Pieds + pouces → centimètres */
export function ftInToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

/** Centimètres → { feet, inches } */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

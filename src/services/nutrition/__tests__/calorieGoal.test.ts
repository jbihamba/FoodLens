/**
 * @file services/nutrition/__tests__/calorieGoal.test.ts
 *
 * Tests unitaires des fonctions pures de calcul calorique.
 * Toutes les valeurs attendues sont documentees avec leur source.
 */

import { describe, expect, it } from '@jest/globals';

import {
  calculateBmr,
  calculateCalorieGoal,
  calculateTdee,
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
  validateManualGoal,
  validateProfile,
} from "@/services/nutrition/calorieGoal";
import { CALORIE_FLOOR, MAX_MANUAL_GOAL } from "@/constants/nutrition";
import type { UserProfile } from "@/types/profile";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const maleProfile: UserProfile = {
  sex: "male",
  age: 30,
  weightKg: 70,
  heightCm: 180,
  activityLevel: "moderate",
  weightGoal: "maintain",
  isPregnantOrBreastfeeding: false,
};

const femaleProfile: UserProfile = {
  sex: "female",
  age: 30,
  weightKg: 60,
  heightCm: 165,
  activityLevel: "light",
  weightGoal: "maintain",
  isPregnantOrBreastfeeding: false,
};

const lowCaloricFemale: UserProfile = {
  sex: "female",
  age: 50,
  weightKg: 50,
  heightCm: 155,
  activityLevel: "sedentary",
  weightGoal: "lose",
  isPregnantOrBreastfeeding: false,
};

// ---------------------------------------------------------------------------
// calculateBmr
// ---------------------------------------------------------------------------

describe("calculateBmr", () => {
  /**
   * Homme, 30 ans, 70 kg, 180 cm :
   * BMR = 10x70 + 6.25x180 - 5x30 + 5
   *     = 700 + 1125 - 150 + 5
   *     = 1680
   */
  it("calcule le BMR masculin correctement", () => {
    expect(calculateBmr(maleProfile)).toBeCloseTo(1680, 1);
  });

  /**
   * Femme, 30 ans, 60 kg, 165 cm :
   * BMR = 10x60 + 6.25x165 - 5x30 - 161
   *     = 600 + 1031.25 - 150 - 161
   *     = 1320.25
   */
  it("calcule le BMR feminin correctement", () => {
    expect(calculateBmr(femaleProfile)).toBeCloseTo(1320.25, 2);
  });

  /**
   * Femme, 50 ans, 50 kg, 155 cm :
   * BMR = 10x50 + 6.25x155 - 5x50 - 161
   *     = 500 + 968.75 - 250 - 161
   *     = 1057.75
   */
  it("calcule le BMR de la femme a faibles calories", () => {
    expect(calculateBmr(lowCaloricFemale)).toBeCloseTo(1057.75, 2);
  });

  it("utilise la constante intermediaire pour le sexe non precise", () => {
    const bmr = calculateBmr({ ...maleProfile, sex: "unspecified" });
    // Doit etre entre la valeur feminine et masculine
    const maleBmr = calculateBmr(maleProfile);
    const femaleBmr = calculateBmr({ ...maleProfile, sex: "female" });
    expect(bmr).toBeGreaterThan(femaleBmr);
    expect(bmr).toBeLessThan(maleBmr);
  });
});

// ---------------------------------------------------------------------------
// calculateTdee
// ---------------------------------------------------------------------------

describe("calculateTdee", () => {
  /**
   * BMR homme = 1680, coefficient modere = 1.55
   * TDEE = 1680 x 1.55 = 2604
   */
  it("calcule le TDEE masculin (activite moderee)", () => {
    const bmr = calculateBmr(maleProfile);
    expect(calculateTdee(bmr, "moderate")).toBeCloseTo(2604, 0);
  });

  /**
   * BMR femme = 1320.25, coefficient leger = 1.375
   * TDEE = 1320.25 x 1.375 ≈ 1815.34
   */
  it("calcule le TDEE feminin (activite legere)", () => {
    const bmr = calculateBmr(femaleProfile);
    expect(calculateTdee(bmr, "light")).toBeCloseTo(1815.34, 0);
  });

  /**
   * BMR femme faible = 1057.75, sedentaire = 1.2
   * TDEE = 1057.75 x 1.2 ≈ 1269.3
   */
  it("calcule le TDEE de la femme sedentaire", () => {
    const bmr = calculateBmr(lowCaloricFemale);
    expect(calculateTdee(bmr, "sedentary")).toBeCloseTo(1269.3, 0);
  });
});

// ---------------------------------------------------------------------------
// calculateCalorieGoal
// ---------------------------------------------------------------------------

describe("calculateCalorieGoal", () => {
  it("renvoie les valeurs correctes pour le profil homme standard", () => {
    const result = calculateCalorieGoal(maleProfile);
    expect(result.bmr).toBeCloseTo(1680, 1);
    expect(result.tdee).toBeCloseTo(2604, 0);
    expect(result.floorApplied).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("arrondit l'objectif a la dizaine la plus proche", () => {
    const result = calculateCalorieGoal(maleProfile);
    expect(result.target % 10).toBe(0);
  });

  it("applique le plancher feminin quand le deficit est trop important", () => {
    const result = calculateCalorieGoal(lowCaloricFemale);
    // -500 kcal sur 1269 donnerait ~769 : sous le plancher de 1200
    expect(result.floorApplied).toBe(true);
    expect(result.target).toBe(CALORIE_FLOOR.female); // 1200
    const floorWarning = result.warnings.find((w) => w.key === "floorApplied");
    expect(floorWarning).toBeDefined();
  });

  it("ajoute un warning et aucun deficit pour grossesse/allaitement", () => {
    const pregnant: UserProfile = {
      ...femaleProfile,
      isPregnantOrBreastfeeding: true,
      weightGoal: "lose",
    };
    const result = calculateCalorieGoal(pregnant);
    // Objectif = TDEE arrondi, pas de deficit
    expect(result.target).toBe(Math.round(result.tdee / 10) * 10);
    expect(result.floorApplied).toBe(false);
    const w = result.warnings.find(
      (ww) => ww.key === "pregnantOrBreastfeeding",
    );
    expect(w).toBeDefined();
  });

  it("ajoute un warning pour age < 19", () => {
    const young: UserProfile = { ...maleProfile, age: 18 };
    const result = calculateCalorieGoal(young);
    const w = result.warnings.find((ww) => ww.key === "ageUnder19");
    expect(w).toBeDefined();
  });

  it("ajoute un warning pour age > 78", () => {
    const old: UserProfile = { ...maleProfile, age: 80 };
    const result = calculateCalorieGoal(old);
    const w = result.warnings.find((ww) => ww.key === "ageOver78");
    expect(w).toBeDefined();
  });

  it("ajoute un warning pour sexe non precise", () => {
    const result = calculateCalorieGoal({ ...maleProfile, sex: "unspecified" });
    const w = result.warnings.find((ww) => ww.key === "sexUnspecified");
    expect(w).toBeDefined();
  });

  it("ajoute un warning si le TDEE lui-meme est proche du plancher (maintien)", () => {
    // Tres petite personne sedentaire, objectif maintien
    const tiny: UserProfile = {
      sex: "female",
      age: 50,
      weightKg: 40,
      heightCm: 100,
      activityLevel: "sedentary",
      weightGoal: "maintain",
      isPregnantOrBreastfeeding: false,
    };
    const result = calculateCalorieGoal(tiny);
    // Si TDEE < plancher on attend le warning tdeeNearFloor
    if (result.tdee < CALORIE_FLOOR.female) {
      const w = result.warnings.find((ww) => ww.key === "tdeeNearFloor");
      expect(w).toBeDefined();
      // On NE force PAS un excedent : objectif = TDEE arrondi
      expect(result.target).toBe(Math.round(result.tdee / 10) * 10);
    }
  });

  it("utilise l'objectif manuel s'il est fourni et valide", () => {
    const result = calculateCalorieGoal(maleProfile, 2500);
    expect(result.target).toBe(2500);
  });

  it("remonte l'objectif manuel au plancher s'il est trop bas", () => {
    const result = calculateCalorieGoal(
      { ...femaleProfile, sex: "female" },
      500,
    );
    expect(result.target).toBe(CALORIE_FLOOR.female);
    expect(result.floorApplied).toBe(true);
  });

  it("ajoute 300 kcal en mode gain", () => {
    const gain: UserProfile = { ...maleProfile, weightGoal: "gain" };
    const result = calculateCalorieGoal(gain);
    // tdee + 300 arrondi a 10
    const expected = Math.round((result.tdee + 300) / 10) * 10;
    expect(result.target).toBe(expected);
  });

  it("retire 500 kcal en mode perte (sans plancher)", () => {
    // Homme costaud : pas de risque de plancher
    const big: UserProfile = {
      ...maleProfile,
      weightKg: 100,
      weightGoal: "lose",
    };
    const result = calculateCalorieGoal(big);
    expect(result.floorApplied).toBe(false);
    const expected = Math.round((result.tdee - 500) / 10) * 10;
    expect(result.target).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// validateProfile
// ---------------------------------------------------------------------------

describe("validateProfile", () => {
  it("retourne aucune erreur pour un profil valide", () => {
    expect(validateProfile(maleProfile)).toHaveLength(0);
  });

  it("refuse l'age < 18 avec un message bienveillant", () => {
    const errors = validateProfile({ ...maleProfile, age: 17 });
    const ageError = errors.find((e) => e.field === "age");
    expect(ageError).toBeDefined();
    expect(ageError!.messageFr).toContain("18 ans");
  });

  it("refuse l'age > 100", () => {
    const errors = validateProfile({ ...maleProfile, age: 101 });
    expect(errors.some((e) => e.field === "age")).toBe(true);
  });

  it("refuse le poids hors bornes (trop bas)", () => {
    const errors = validateProfile({ ...maleProfile, weightKg: 20 });
    expect(errors.some((e) => e.field === "weightKg")).toBe(true);
  });

  it("refuse le poids hors bornes (trop haut)", () => {
    const errors = validateProfile({ ...maleProfile, weightKg: 400 });
    expect(errors.some((e) => e.field === "weightKg")).toBe(true);
  });

  it("refuse la taille hors bornes", () => {
    const errors = validateProfile({ ...maleProfile, heightCm: 50 });
    expect(errors.some((e) => e.field === "heightCm")).toBe(true);
  });

  it("signale plusieurs erreurs simultanement", () => {
    const errors = validateProfile({ age: 17, weightKg: 20, heightCm: 50 });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// validateManualGoal
// ---------------------------------------------------------------------------

describe("validateManualGoal", () => {
  it("accepte un objectif valide", () => {
    expect(validateManualGoal(2000, "female")).toBeNull();
  });

  it("refuse sous le plancher feminin", () => {
    const result = validateManualGoal(CALORIE_FLOOR.female - 1, "female");
    expect(result).not.toBeNull();
    expect(result!.messageFr).toContain(String(CALORIE_FLOOR.female));
  });

  it("refuse sous le plancher masculin", () => {
    const result = validateManualGoal(CALORIE_FLOOR.male - 1, "male");
    expect(result).not.toBeNull();
    expect(result!.messageFr).toContain(String(CALORIE_FLOOR.male));
  });

  it("refuse au-dessus de MAX_MANUAL_GOAL", () => {
    const result = validateManualGoal(MAX_MANUAL_GOAL + 1, "male");
    expect(result).not.toBeNull();
  });

  it("refuse une valeur negative", () => {
    expect(validateManualGoal(-100, "female")).not.toBeNull();
  });

  it("refuse NaN", () => {
    expect(validateManualGoal(NaN, "female")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Conversions d'unites
// ---------------------------------------------------------------------------

describe("conversions d'unites", () => {
  it("convertit les livres en kg et inversement", () => {
    expect(lbsToKg(154)).toBeCloseTo(69.85, 1);
    expect(kgToLbs(70)).toBeCloseTo(154.32, 1);
  });

  it("convertit ft/in en cm", () => {
    // 5 ft 9 in = 175.26 cm
    expect(ftInToCm(5, 9)).toBeCloseTo(175.26, 1);
  });

  it("convertit cm en ft/in", () => {
    const { feet, inches } = cmToFtIn(175.26);
    expect(feet).toBe(5);
    expect(inches).toBe(9);
  });

  it("fait un aller-retour coherent kg -> lb -> kg", () => {
    const original = 75.5;
    expect(lbsToKg(kgToLbs(original))).toBeCloseTo(original, 3);
  });
});

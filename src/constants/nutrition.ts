/**
 * @file constants/nutrition.ts
 *
 * Tous les seuils, coefficients et planchers du calcul calorique sont ici.
 * Pour modifier un seuil, changer uniquement ce fichier — aucun autre fichier
 * n'encode ces valeurs en dur.
 */

// ---------------------------------------------------------------------------
// Coefficients d'activité — Mifflin-St Jeor (1990)
// ---------------------------------------------------------------------------
export const ACTIVITY_COEFFICIENTS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_COEFFICIENTS;

export const ACTIVITY_LABELS: Record<ActivityLevel, { fr: string; en: string }> = {
  sedentary: {
    fr: 'Sédentaire',
    en: 'Sedentary',
  },
  light: {
    fr: 'Légèrement actif',
    en: 'Lightly active',
  },
  moderate: {
    fr: 'Modérément actif',
    en: 'Moderately active',
  },
  active: {
    fr: 'Très actif',
    en: 'Very active',
  },
  veryActive: {
    fr: 'Extrêmement actif',
    en: 'Extremely active',
  },
};

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, { fr: string; en: string }> = {
  sedentary: {
    fr: "Peu ou pas d'exercice",
    en: 'Little or no exercise',
  },
  light: {
    fr: 'Exercice léger 1 à 3 jours par semaine',
    en: 'Light exercise 1–3 days per week',
  },
  moderate: {
    fr: 'Exercice modéré 3 à 5 jours par semaine',
    en: 'Moderate exercise 3–5 days per week',
  },
  active: {
    fr: 'Exercice intense 6 à 7 jours par semaine',
    en: 'Hard exercise 6–7 days per week',
  },
  veryActive: {
    fr: 'Exercice très intense quotidien ou travail physique exigeant',
    en: 'Very hard daily exercise or physical job',
  },
};

// ---------------------------------------------------------------------------
// Objectifs de poids
// ---------------------------------------------------------------------------
export const WEIGHT_GOAL_ADJUSTMENTS = {
  /** Déficit recommandé pour la perte de poids (kcal/jour) */
  lose: -500,
  /** Aucun ajustement pour le maintien */
  maintain: 0,
  /** Surplus pour la prise de masse (kcal/jour) */
  gain: 300,
} as const;

export type WeightGoal = keyof typeof WEIGHT_GOAL_ADJUSTMENTS;

export const WEIGHT_GOAL_LABELS: Record<WeightGoal, { fr: string; en: string }> = {
  lose: { fr: 'Perdre du poids', en: 'Lose weight' },
  maintain: { fr: 'Maintenir mon poids', en: 'Maintain weight' },
  gain: { fr: 'Prendre du poids', en: 'Gain weight' },
};

// ---------------------------------------------------------------------------
// Planchers de sécurité
// IMPORTANT : ces valeurs sont des conventions courantes dans la littérature
// diététique (ex. : régimes VLCD supervisés recommandent ≥ 800 kcal, les
// organismes comme l'ANSES déconseillent moins de 1 200 kcal sans suivi
// médical). Ce ne sont PAS des seuils médicaux universels validés par une
// étude clinique. Modifier avec discernement et toujours afficher un message
// invitant l'utilisateur à consulter un professionnel de santé.
// ---------------------------------------------------------------------------
export const CALORIE_FLOOR = {
  /** Plancher recommandé pour les femmes (kcal/jour) */
  female: 1200,
  /** Plancher recommandé pour les hommes (kcal/jour) */
  male: 1500,
  /**
   * Plancher pour le sexe non précisé.
   * Choix de conception : on prend la valeur haute pour être plus prudent.
   */
  unspecified: 1200,
} as const;

/** Borne haute raisonnable pour éviter les erreurs de saisie (kcal/jour) */
export const MAX_MANUAL_GOAL = 5000;

// ---------------------------------------------------------------------------
// Bornes de saisie du profil (choix de conception)
// ---------------------------------------------------------------------------
export const PROFILE_BOUNDS = {
  age: { min: 18, max: 100 },
  weightKg: { min: 30, max: 300 },
  heightCm: { min: 100, max: 250 },
} as const;

/**
 * Constante Mifflin-St Jeor pour le sexe non précisé.
 * CHOIX DE CONCEPTION NON VALIDÉ PAR L'ÉTUDE ORIGINALE :
 * La formule de Mifflin-St Jeor (1990) n'inclut pas de terme neutre.
 * On utilise ici une valeur intermédiaire entre +5 (homme) et −161 (femme),
 * soit −78 (arrondi à la dizaine). Cette interpolation linéaire est arbitraire
 * et produit une estimation moins précise. L'utilisateur en est informé.
 */
export const SEX_CONSTANT_UNSPECIFIED = -78;

// ---------------------------------------------------------------------------
// Tranches d'âge — fiabilité de la formule
// ---------------------------------------------------------------------------
/**
 * L'étude de Mifflin-St Jeor couvre les 19-78 ans.
 * Entre 18-19 ans et au-delà de 78 ans, le calcul s'applique mais
 * l'estimation est moins fiable.
 */
export const FORMULA_RELIABLE_AGE = { min: 19, max: 78 } as const;

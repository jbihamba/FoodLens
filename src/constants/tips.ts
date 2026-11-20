export const TIP_THRESHOLDS = {
  minimumTrackedDays: 3,
  repeatCooldownDays: 3,
  dismissalCooldownDays: 7,
  maximumTips: 3,
  proteinLowRatio: 0.8,
  caloriesOverGoalDays: 4,
  caloriesLowRatio: 0.7,
  caloriesLowDays: 4,
  waterGoalDays: 3,
  fiberRecommendationRatio: 0.7,
  trackingGapDays: 2,
  breakfastMissingDays: 5,
  calorieTrendRatio: 0.15,
  macroImbalanceShare: 0.6,
  positiveStreakDays: [3, 7, 14],
} as const;

export const TIP_REFERENCE_GOALS = {
  proteinGramsPerDay: 50,
  fiberGramsPerDay: 25,
  waterMillilitersPerDay: 2000,
} as const;

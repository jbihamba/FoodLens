import type { TipTextKey, TipTranslationParams } from '@/i18n/tips';

export type TipSeverity = 'info' | 'positive' | 'attention';

export interface TipAction {
  labelKey: TipTextKey;
  target: 'entry' | 'calendar';
}

export interface Tip {
  id: string;
  ruleId: string;
  severity: TipSeverity;
  titleKey: TipTextKey;
  messageKey: TipTextKey;
  params: TipTranslationParams;
  createdAt: string;
  importance: number;
  highlightValue: string;
  highlightLabelKey: TipTextKey;
  action?: TipAction;
}

export interface TipMetricStats {
  total: number | null;
  averagePerDay: number | null;
  trackedDays: number;
}

export interface TipDayStats {
  date: string;
  mealCount: number;
  calories: number;
  proteinGrams: number | null;
  carbohydrateGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  waterMilliliters: number | null;
  morningMeals: number;
  middayMeals: number;
  eveningMeals: number;
  breakfastCount: number;
}

export interface TipPeriodStats {
  days: TipDayStats[];
  trackedDays: number;
  calories: TipMetricStats;
  proteins: TipMetricStats;
  carbohydrates: TipMetricStats;
  fats: TipMetricStats;
  fibers: TipMetricStats;
  water: TipMetricStats;
  totalMeals: number;
  averageMealsPerTrackedDay: number | null;
  mealDistribution: {
    morning: number;
    midday: number;
    evening: number;
  };
  daysAboveCalorieGoal: number;
  daysAtOrAboveCalorieGoal: number;
  daysBelowSeventyPercentCalorieGoal: number;
  proteinGoalDays: number;
  waterGoalDays: number | null;
  breakfastMissingDays: number;
  trackingGapDays: number;
  currentTrackingGapDays: number;
  longestTrackingGapDays: number;
}

export interface TipStats {
  current: TipPeriodStats;
  previous: TipPeriodStats;
  currentStreak: number;
  generatedAt: string;
}

export interface TipGoals {
  dailyCalories: number;
  proteinGrams: number | null;
  fiberGrams: number | null;
  waterMilliliters: number | null;
}

export interface TipProfile {
  displayName: string | null;
}

export interface TipHistory {
  lastShownAt: Record<string, string>;
  dismissedUntil: Record<string, string>;
  activeRuleIds: string[];
}

export interface TipRule {
  (stats: TipStats, goals: TipGoals, profile: TipProfile): Tip | null;
}

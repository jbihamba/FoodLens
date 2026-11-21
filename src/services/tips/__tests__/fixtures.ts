import type { TipPeriodStats, TipStats } from '../types';

export const TEST_DATE = '2025-01-15T12:00:00.000Z';

export function metric(averagePerDay: number | null, trackedDays = 7) {
  return {
    total:
      averagePerDay === null ? null : averagePerDay * trackedDays,
    averagePerDay,
    trackedDays: averagePerDay === null ? 0 : trackedDays,
  };
}

function makePeriod(overrides: Partial<TipPeriodStats> = {}): TipPeriodStats {
  const base: TipPeriodStats = {
    days: Array.from({ length: 7 }, (_, index) => ({
      date: `2025-01-${String(index + 1).padStart(2, '0')}`,
      mealCount: 3,
      calories: 1800,
      proteinGrams: 50,
      carbohydrateGrams: 200,
      fatGrams: 70,
      fiberGrams: 25,
      waterMilliliters: 2000,
      morningMeals: 1,
      middayMeals: 1,
      eveningMeals: 1,
      breakfastCount: 1,
    })),
    trackedDays: 7,
    calories: metric(1800),
    proteins: metric(50),
    carbohydrates: metric(200),
    fats: metric(70),
    fibers: metric(25),
    water: metric(2000),
    totalMeals: 21,
    averageMealsPerTrackedDay: 3,
    mealDistribution: { morning: 7, midday: 7, evening: 7 },
    daysAboveCalorieGoal: 0,
    daysAtOrAboveCalorieGoal: 0,
    daysBelowSeventyPercentCalorieGoal: 0,
    proteinGoalDays: 7,
    waterGoalDays: 7,
    breakfastMissingDays: 0,
    trackingGapDays: 0,
    currentTrackingGapDays: 0,
    longestTrackingGapDays: 0,
  };

  return {
    ...base,
    ...overrides,
    calories: { ...base.calories, ...overrides.calories },
    proteins: { ...base.proteins, ...overrides.proteins },
    carbohydrates: { ...base.carbohydrates, ...overrides.carbohydrates },
    fats: { ...base.fats, ...overrides.fats },
    fibers: { ...base.fibers, ...overrides.fibers },
    water: { ...base.water, ...overrides.water },
  };
}

export function makeStats(
  current: Partial<TipPeriodStats> = {},
  previous: Partial<TipPeriodStats> = {},
  currentStreak = 0,
): TipStats {
  return {
    current: makePeriod(current),
    previous: makePeriod(previous),
    currentStreak,
    generatedAt: TEST_DATE,
  };
}

export const TEST_GOALS = {
  dailyCalories: 1800,
  proteinGrams: 50,
  fiberGrams: 25,
  waterMilliliters: 2000,
};

export const TEST_PROFILE = { displayName: null };

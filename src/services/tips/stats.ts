import type { SQLiteDatabase } from 'expo-sqlite';

import { TIP_REFERENCE_GOALS } from '@/constants/tips';
import { DEFAULT_DAILY_GOAL, getDailyGoal } from '@/services/calorieTracking';

import type {
  TipDayStats,
  TipMetricStats,
  TipPeriodStats,
  TipStats,
} from './types';

interface FoodTipRow {
  consumed_at: string;
  meal_type: string | null;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g?: number | null;
}

interface WaterTipRow {
  consumed_at: string;
  amount_ml: number;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function atLocalMidnight(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function shiftDay(date: Date, amount: number) {
  const result = atLocalMidnight(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function finiteOrNull(value: number | null | undefined) {
  return value !== null && value !== undefined && Number.isFinite(value)
    ? value
    : null;
}

function classifyMeal(mealType: string | null, consumedAt: string) {
  const type = mealType?.trim().toLowerCase();
  if (type === 'breakfast') return 'morning';
  if (type === 'lunch') return 'midday';
  if (type === 'dinner') return 'evening';

  const hour = new Date(consumedAt).getHours();
  if (hour < 11) return 'morning';
  if (hour < 16) return 'midday';
  return 'evening';
}

function createDay(date: string): TipDayStats {
  return {
    date,
    mealCount: 0,
    calories: 0,
    proteinGrams: null,
    carbohydrateGrams: null,
    fatGrams: null,
    fiberGrams: null,
    waterMilliliters: null,
    morningMeals: 0,
    middayMeals: 0,
    eveningMeals: 0,
    breakfastCount: 0,
  };
}

function summarizeMetric(
  values: (number | null)[],
  denominator?: number,
): TipMetricStats {
  const knownValues = values.filter((value): value is number => value !== null);
  const total = knownValues.reduce((sum, value) => sum + value, 0);
  return {
    total: knownValues.length ? total : null,
    averagePerDay: knownValues.length ? total / (denominator ?? knownValues.length) : null,
    trackedDays: knownValues.length,
  };
}

function longestGap(days: TipDayStats[]) {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    if (day.mealCount === 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function endingGap(days: TipDayStats[]) {
  let gap = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].mealCount > 0) break;
    gap += 1;
  }
  return gap;
}

function createPeriod(
  days: TipDayStats[],
  calorieGoal: number,
  waterGoal: number,
): TipPeriodStats {
  const trackedDays = days.filter((day) => day.mealCount > 0);
  const proteins = summarizeMetric(
    days.map((day) => day.proteinGrams),
  );
  const carbohydrates = summarizeMetric(
    days.map((day) => day.carbohydrateGrams),
  );
  const fats = summarizeMetric(days.map((day) => day.fatGrams));
  const fibers = summarizeMetric(days.map((day) => day.fiberGrams));
  const water = summarizeMetric(days.map((day) => day.waterMilliliters));
  const calorieTotal = trackedDays.reduce((sum, day) => sum + day.calories, 0);
  const waterGoalDays =
    water.trackedDays > 0
      ? days.filter(
          (day) =>
            day.waterMilliliters !== null && day.waterMilliliters >= waterGoal,
        ).length
      : null;
  const proteinGoalDays = days.filter(
    (day) =>
      day.proteinGrams !== null &&
      day.proteinGrams >= TIP_REFERENCE_GOALS.proteinGramsPerDay,
  ).length;

  return {
    days,
    trackedDays: trackedDays.length,
    calories: {
      total: trackedDays.length ? calorieTotal : null,
      averagePerDay: trackedDays.length ? calorieTotal / trackedDays.length : null,
      trackedDays: trackedDays.length,
    },
    proteins,
    carbohydrates,
    fats,
    fibers,
    water,
    totalMeals: days.reduce((sum, day) => sum + day.mealCount, 0),
    averageMealsPerTrackedDay: trackedDays.length
      ? days.reduce((sum, day) => sum + day.mealCount, 0) / trackedDays.length
      : null,
    mealDistribution: {
      morning: days.reduce((sum, day) => sum + day.morningMeals, 0),
      midday: days.reduce((sum, day) => sum + day.middayMeals, 0),
      evening: days.reduce((sum, day) => sum + day.eveningMeals, 0),
    },
    daysAboveCalorieGoal: trackedDays.filter((day) => day.calories > calorieGoal).length,
    daysAtOrAboveCalorieGoal: trackedDays.filter((day) => day.calories >= calorieGoal).length,
    daysBelowSeventyPercentCalorieGoal: trackedDays.filter(
      (day) => day.calories < calorieGoal * 0.7,
    ).length,
    proteinGoalDays,
    waterGoalDays,
    breakfastMissingDays: trackedDays.filter((day) => day.breakfastCount === 0).length,
    trackingGapDays: days.length - trackedDays.length,
    currentTrackingGapDays: endingGap(days),
    longestTrackingGapDays: longestGap(days),
  };
}

function getCurrentStreak(days: TipDayStats[]) {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].mealCount === 0) break;
    streak += 1;
  }
  return streak;
}

export async function getTipStats(db: SQLiteDatabase, now = new Date()) {
  const today = atLocalMidnight(now);
  const oldestDay = shiftDay(today, -13);
  const tomorrow = shiftDay(today, 1);
  const allDates = Array.from({ length: 14 }, (_, index) =>
    localDateKey(shiftDay(oldestDay, index)),
  );
  const dayMap = new Map(allDates.map((date) => [date, createDay(date)]));

  const columns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(food_entries)',
  );
  const hasFiberColumn = columns.some((column) => column.name === 'fiber_g');
  const fiberProjection = hasFiberColumn ? ', fiber_g' : '';
  const foodRows = await db.getAllAsync<FoodTipRow>(
    `SELECT consumed_at, meal_type, calories, protein_g, carbs_g, fat_g${fiberProjection}
     FROM food_entries
     WHERE consumed_at >= ? AND consumed_at < ?
     ORDER BY consumed_at`,
    oldestDay.toISOString(),
    tomorrow.toISOString(),
  );

  for (const entry of foodRows) {
    const date = new Date(entry.consumed_at);
    if (Number.isNaN(date.getTime())) continue;
    const day = dayMap.get(localDateKey(date));
    if (!day) continue;

    day.mealCount += 1;
    day.calories += finiteOrNull(entry.calories) ?? 0;
    const protein = finiteOrNull(entry.protein_g);
    const carbohydrates = finiteOrNull(entry.carbs_g);
    const fat = finiteOrNull(entry.fat_g);
    const fiber = hasFiberColumn ? finiteOrNull(entry.fiber_g) : null;
    if (protein !== null) day.proteinGrams = (day.proteinGrams ?? 0) + protein;
    if (carbohydrates !== null) {
      day.carbohydrateGrams = (day.carbohydrateGrams ?? 0) + carbohydrates;
    }
    if (fat !== null) day.fatGrams = (day.fatGrams ?? 0) + fat;
    if (fiber !== null) day.fiberGrams = (day.fiberGrams ?? 0) + fiber;
    if (entry.meal_type?.trim().toLowerCase() === 'breakfast') day.breakfastCount += 1;

    const period = classifyMeal(entry.meal_type, entry.consumed_at);
    if (period === 'morning') day.morningMeals += 1;
    else if (period === 'midday') day.middayMeals += 1;
    else day.eveningMeals += 1;
  }

  let waterColumn: 'consumed_at' | 'created_at' | null = null;
  const waterTable = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    'water_logs',
  );
  if (waterTable) {
    const waterColumns = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(water_logs)',
    );
    const names = new Set(waterColumns.map((column) => column.name));
    if (names.has('amount_ml')) {
      waterColumn = names.has('consumed_at')
        ? 'consumed_at'
        : names.has('created_at')
          ? 'created_at'
          : null;
    }
  }

  if (waterColumn) {
    const waterRows = await db.getAllAsync<WaterTipRow>(
      `SELECT ${waterColumn} AS consumed_at, amount_ml
       FROM water_logs
       WHERE ${waterColumn} >= ? AND ${waterColumn} < ?`,
      oldestDay.toISOString(),
      tomorrow.toISOString(),
    );
    for (const log of waterRows) {
      const date = new Date(log.consumed_at);
      if (Number.isNaN(date.getTime())) continue;
      const day = dayMap.get(localDateKey(date));
      const amount = finiteOrNull(log.amount_ml);
      if (day && amount !== null) {
        day.waterMilliliters = (day.waterMilliliters ?? 0) + amount;
      }
    }
  }

  const days = allDates.map((date) => dayMap.get(date)!);
  const dailyGoal = await getDailyGoal(db);
  const calorieGoal =
    dailyGoal && Number.isFinite(dailyGoal.target_calories) && dailyGoal.target_calories > 0
      ? dailyGoal.target_calories
      : DEFAULT_DAILY_GOAL;
  const current = createPeriod(days.slice(7), calorieGoal, TIP_REFERENCE_GOALS.waterMillilitersPerDay);
  const previous = createPeriod(days.slice(0, 7), calorieGoal, TIP_REFERENCE_GOALS.waterMillilitersPerDay);

  const stats: TipStats = {
    current,
    previous,
    currentStreak: getCurrentStreak(days),
    generatedAt: now.toISOString(),
  };

  return {
    stats,
    goals: {
      dailyCalories: calorieGoal,
      proteinGrams: TIP_REFERENCE_GOALS.proteinGramsPerDay,
      fiberGrams: hasFiberColumn ? TIP_REFERENCE_GOALS.fiberGramsPerDay : null,
      waterMilliliters: waterColumn ? TIP_REFERENCE_GOALS.waterMillilitersPerDay : null,
    },
  };
}

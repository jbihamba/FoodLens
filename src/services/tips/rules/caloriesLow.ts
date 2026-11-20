import { TIP_THRESHOLDS } from '@/constants/tips';

import type { TipRule } from '../types';
import { hasEnoughTrackedDays, makeTip } from './shared';

const caloriesLow: TipRule = (stats, goals) => {
  const average = stats.current.calories.averagePerDay;
  if (
    !hasEnoughTrackedDays(stats) ||
    average === null ||
    goals.dailyCalories <= 0 ||
    stats.current.daysBelowSeventyPercentCalorieGoal < TIP_THRESHOLDS.caloriesLowDays ||
    average >= goals.dailyCalories * TIP_THRESHOLDS.caloriesLowRatio
  ) {
    return null;
  }

  const percentOfGoal = Math.round((average / goals.dailyCalories) * 100);
  return makeTip(
    stats,
    'calories-below-goal',
    'info',
    'tips.calories.low.title',
    'tips.calories.low.message',
    { days: stats.current.daysBelowSeventyPercentCalorieGoal, percent: percentOfGoal },
    `${percentOfGoal}%`,
    'tips.metric.calories',
    100 - percentOfGoal,
    { labelKey: 'tips.action.addMeal', target: 'entry' },
  );
};

export default caloriesLow;

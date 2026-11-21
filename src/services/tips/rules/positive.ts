import { TIP_THRESHOLDS } from '@/constants/tips';

import type { TipRule } from '../types';
import { makeTip } from './shared';

const positive: TipRule = (stats, goals) => {
  if (stats.current.trackedDays < TIP_THRESHOLDS.minimumTrackedDays) return null;

  if ((TIP_THRESHOLDS.positiveStreakDays as readonly number[]).includes(stats.currentStreak)) {
    return makeTip(
      stats,
      'tracking-streak',
      'positive',
      'tips.positive.streak.title',
      'tips.positive.streak.message',
      { days: stats.currentStreak },
      `${stats.currentStreak}`,
      'tips.ui.day',
      stats.currentStreak,
    );
  }

  if (
    goals.proteinGrams !== null &&
    stats.current.proteins.trackedDays === 7 &&
    stats.current.proteinGoalDays === 7
  ) {
    return makeTip(
      stats,
      'protein-goal-week',
      'positive',
      'tips.positive.protein.title',
      'tips.positive.protein.message',
      {},
      '7 / 7',
      'tips.ui.day',
      7,
    );
  }

  return null;
};

export default positive;

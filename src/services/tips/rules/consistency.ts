import { TIP_THRESHOLDS } from '@/constants/tips';

import type { TipRule } from '../types';
import { hasEnoughTrackedDays, makeTip } from './shared';

const consistency: TipRule = (stats) => {
  const gap = stats.current.currentTrackingGapDays;
  if (!hasEnoughTrackedDays(stats) || gap < TIP_THRESHOLDS.trackingGapDays) return null;

  return makeTip(
    stats,
    'tracking-gap',
    'info',
    'tips.consistency.title',
    'tips.consistency.message',
    { days: gap },
    `${gap}`,
    'tips.metric.days',
    gap - TIP_THRESHOLDS.trackingGapDays,
    { labelKey: 'tips.action.addMeal', target: 'entry' },
  );
};

export default consistency;

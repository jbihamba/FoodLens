import { TIP_THRESHOLDS } from '@/constants/tips';

import type { TipRule } from '../types';
import { hasEnoughTrackedDays, makeTip } from './shared';

const macroBalance: TipRule = (stats) => {
  if (
    !hasEnoughTrackedDays(stats) ||
    stats.current.proteins.trackedDays < TIP_THRESHOLDS.minimumTrackedDays ||
    stats.current.carbohydrates.trackedDays < TIP_THRESHOLDS.minimumTrackedDays ||
    stats.current.fats.trackedDays < TIP_THRESHOLDS.minimumTrackedDays
  ) {
    return null;
  }

  const shares = [
    {
      metric: 'carbohydrates' as const,
      energy: (stats.current.carbohydrates.averagePerDay ?? 0) * 4,
      labelKey: 'tips.metric.carbohydrates' as const,
    },
    {
      metric: 'protein' as const,
      energy: (stats.current.proteins.averagePerDay ?? 0) * 4,
      labelKey: 'tips.metric.protein' as const,
    },
    {
      metric: 'fat' as const,
      energy: (stats.current.fats.averagePerDay ?? 0) * 9,
      labelKey: 'tips.metric.fat' as const,
    },
  ];
  const totalEnergy = shares.reduce((sum, item) => sum + item.energy, 0);
  if (totalEnergy <= 0) return null;

  const leadingMacro = shares.reduce((highest, current) =>
    current.energy > highest.energy ? current : highest,
  );
  const share = leadingMacro.energy / totalEnergy;
  if (share <= TIP_THRESHOLDS.macroImbalanceShare) return null;

  const percent = Math.round(share * 100);
  return makeTip(
    stats,
    'macro-balance',
    'info',
    'tips.macros.title',
    'tips.macros.message',
    { macro: leadingMacro.labelKey, percent },
    `${percent}%`,
    'tips.metric.macros',
    percent - TIP_THRESHOLDS.macroImbalanceShare * 100,
  );
};

export default macroBalance;

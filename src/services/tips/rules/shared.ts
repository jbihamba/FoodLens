import { TIP_THRESHOLDS } from '@/constants/tips';

import type {
  Tip,
  TipAction,
  TipGoals,
  TipProfile,
  TipSeverity,
  TipStats,
} from '../types';
import type { TipTextKey, TipTranslationParams } from '@/i18n/tips';

export function hasEnoughTrackedDays(stats: TipStats) {
  return stats.current.trackedDays >= TIP_THRESHOLDS.minimumTrackedDays;
}

export function makeTip(
  stats: TipStats,
  ruleId: string,
  severity: TipSeverity,
  titleKey: TipTextKey,
  messageKey: TipTextKey,
  params: TipTranslationParams,
  highlightValue: string,
  highlightLabelKey: TipTextKey,
  importance: number,
  action?: TipAction,
): Tip {
  return {
    id: ruleId,
    ruleId,
    severity,
    titleKey,
    messageKey,
    params,
    createdAt: stats.generatedAt,
    importance,
    highlightValue,
    highlightLabelKey,
    ...(action ? { action } : {}),
  };
}

export type TipRuleInputs = [TipStats, TipGoals, TipProfile];

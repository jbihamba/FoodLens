import { TIP_THRESHOLDS } from "@/constants/tips";

import breakfastMissing from "./rules/breakfastMissing";
import caloriesLow from "./rules/caloriesLow";
import caloriesOver from "./rules/caloriesOver";
import calorieTrend from "./rules/calorieTrend";
import consistency from "./rules/consistency";
import fiberLow from "./rules/fiberLow";
import macroBalance from "./rules/macroBalance";
import positive from "./rules/positive";
import proteinLow from "./rules/proteinLow";
import waterLow from "./rules/waterLow";
import type {
  Tip,
  TipHistory,
  TipRule,
  TipStats,
  TipGoals,
  TipProfile,
} from "./types";

export const TIP_RULES: readonly TipRule[] = [
  proteinLow,
  caloriesOver,
  caloriesLow,
  waterLow,
  fiberLow,
  consistency,
  breakfastMissing,
  calorieTrend,
  positive,
  macroBalance,
];

export const EMPTY_TIP_HISTORY: TipHistory = {
  lastShownAt: {},
  dismissedUntil: {},
  activeRuleIds: [],
};

const severityOrder = {
  attention: 0,
  info: 1,
  positive: 2,
} satisfies Record<Tip["severity"], number>;

function isWithinCooldown(
  timestamp: string | undefined,
  now: number,
  days: number,
) {
  if (!timestamp) return false;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) && now - parsed < days * 24 * 60 * 60 * 1000;
}

function compareTips(left: Tip, right: Tip) {
  return (
    severityOrder[left.severity] - severityOrder[right.severity] ||
    right.importance - left.importance ||
    left.ruleId.localeCompare(right.ruleId)
  );
}

export function generateTips(
  stats: TipStats,
  goals: TipGoals,
  profile: TipProfile,
  history: TipHistory = EMPTY_TIP_HISTORY,
): Tip[] {
  if (stats.current.trackedDays < TIP_THRESHOLDS.minimumTrackedDays) return [];

  const now = Date.parse(stats.generatedAt);
  if (!Number.isFinite(now)) {
    throw new Error(
      "Tip statistics must include a valid generation timestamp.",
    );
  }

  const generated = TIP_RULES.map((rule) => rule(stats, goals, profile)).filter(
    (tip): tip is Tip => tip !== null,
  );
  const hasCaloriesOverTip = generated.some(
    (tip) => tip.ruleId === "calories-over-goal",
  );
  const contradictionFiltered = generated.filter(
    (tip) => !(hasCaloriesOverTip && tip.ruleId === "calories-below-goal"),
  );
  const activeRuleIds = new Set(history.activeRuleIds);
  const candidates = contradictionFiltered
    .filter(
      (tip) =>
        !isWithinCooldown(history.dismissedUntil[tip.ruleId], now, 0) &&
        !(
          !activeRuleIds.has(tip.ruleId) &&
          isWithinCooldown(
            history.lastShownAt[tip.ruleId],
            now,
            TIP_THRESHOLDS.repeatCooldownDays,
          )
        ),
    )
    .sort(compareTips);

  const selected = candidates.slice(0, TIP_THRESHOLDS.maximumTips);
  const positiveTip = candidates.find((tip) => tip.severity === "positive");
  if (positiveTip && !selected.some((tip) => tip.severity === "positive")) {
    return [
      ...candidates
        .filter((tip) => tip.severity !== "positive")
        .slice(0, TIP_THRESHOLDS.maximumTips - 1),
      positiveTip,
    ].sort(compareTips);
  }

  return selected.sort(compareTips);
}

import { TIP_THRESHOLDS } from "@/constants/tips";

import type { TipRule } from "../types";
import { hasEnoughTrackedDays, makeTip } from "./shared";

const waterLow: TipRule = (stats, goals) => {
  const daysReached = stats.current.waterGoalDays;
  if (
    !hasEnoughTrackedDays(stats) ||
    goals.waterMilliliters === null ||
    daysReached === null ||
    stats.current.water.trackedDays < TIP_THRESHOLDS.minimumTrackedDays ||
    daysReached >= TIP_THRESHOLDS.waterGoalDays
  ) {
    return null;
  }

  return makeTip(
    stats,
    "water-goal-low",
    "info",
    "tips.water.low.title",
    "tips.water.low.message",
    { days: daysReached },
    `${daysReached} / 7`,
    "tips.metric.water",
    TIP_THRESHOLDS.waterGoalDays - daysReached,
  );
};

export default waterLow;

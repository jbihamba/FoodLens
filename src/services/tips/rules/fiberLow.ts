import { TIP_THRESHOLDS } from "@/constants/tips";

import type { TipRule } from "../types";
import { hasEnoughTrackedDays, makeTip } from "./shared";

const fiberLow: TipRule = (stats, goals) => {
  const average = stats.current.fibers.averagePerDay;
  const goal = goals.fiberGrams;
  if (
    !hasEnoughTrackedDays(stats) ||
    average === null ||
    goal === null ||
    goal <= 0 ||
    stats.current.fibers.trackedDays < TIP_THRESHOLDS.minimumTrackedDays
  ) {
    return null;
  }

  const percentBelow = Math.round(((goal - average) / goal) * 100);
  if (average >= goal * TIP_THRESHOLDS.fiberRecommendationRatio) return null;

  return makeTip(
    stats,
    "fiber-low",
    "info",
    "tips.fiber.low.title",
    "tips.fiber.low.message",
    { percent: percentBelow },
    `−${percentBelow}%`,
    "tips.metric.fiber",
    percentBelow,
  );
};

export default fiberLow;

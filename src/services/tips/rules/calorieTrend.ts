import { TIP_THRESHOLDS } from "@/constants/tips";

import type { TipRule } from "../types";
import { makeTip } from "./shared";

const calorieTrend: TipRule = (stats) => {
  const currentAverage = stats.current.calories.averagePerDay;
  const previousAverage = stats.previous.calories.averagePerDay;
  if (
    stats.current.trackedDays < TIP_THRESHOLDS.minimumTrackedDays ||
    stats.previous.trackedDays < TIP_THRESHOLDS.minimumTrackedDays ||
    currentAverage === null ||
    previousAverage === null ||
    previousAverage <= 0
  ) {
    return null;
  }

  const rawChange = (currentAverage - previousAverage) / previousAverage;
  if (Math.abs(rawChange) <= TIP_THRESHOLDS.calorieTrendRatio) return null;

  const isIncreasing = rawChange > 0;
  const percent = Math.round(Math.abs(rawChange) * 100);
  return makeTip(
    stats,
    "calorie-trend",
    "info",
    isIncreasing ? "tips.trend.up.title" : "tips.trend.down.title",
    isIncreasing ? "tips.trend.up.message" : "tips.trend.down.message",
    { percent },
    `${isIncreasing ? "+" : "−"}${percent}%`,
    "tips.metric.calories",
    percent,
  );
};

export default calorieTrend;

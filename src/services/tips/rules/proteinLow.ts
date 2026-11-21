import { TIP_THRESHOLDS } from "@/constants/tips";

import type { TipRule } from "../types";
import { hasEnoughTrackedDays, makeTip } from "./shared";

const proteinLow: TipRule = (stats, goals) => {
  const average = stats.current.proteins.averagePerDay;
  const goal = goals.proteinGrams;
  if (
    !hasEnoughTrackedDays(stats) ||
    average === null ||
    goal === null ||
    stats.current.proteins.trackedDays < TIP_THRESHOLDS.minimumTrackedDays ||
    goal <= 0
  ) {
    return null;
  }

  const percentBelow = Math.round(((goal - average) / goal) * 100);
  if (average > goal * TIP_THRESHOLDS.proteinLowRatio) return null;

  return makeTip(
    stats,
    "protein-low",
    "info",
    "tips.protein.title",
    "tips.protein.message",
    { percent: percentBelow },
    `−${percentBelow}%`,
    "tips.metric.protein",
    percentBelow,
    { labelKey: "tips.action.viewDiary", target: "calendar" },
  );
};

export default proteinLow;

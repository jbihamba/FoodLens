import { TIP_THRESHOLDS } from "@/constants/tips";

import type { TipRule } from "../types";
import { hasEnoughTrackedDays, makeTip } from "./shared";

const breakfastMissing: TipRule = (stats) => {
  const missingDays = stats.current.breakfastMissingDays;
  if (
    !hasEnoughTrackedDays(stats) ||
    stats.current.trackedDays < TIP_THRESHOLDS.breakfastMissingDays ||
    missingDays < TIP_THRESHOLDS.breakfastMissingDays
  ) {
    return null;
  }

  return makeTip(
    stats,
    "breakfast-not-recorded",
    "info",
    "tips.breakfast.title",
    "tips.breakfast.message",
    { days: missingDays },
    `${missingDays} / 7`,
    "tips.metric.breakfast",
    missingDays - TIP_THRESHOLDS.breakfastMissingDays,
    { labelKey: "tips.action.viewDiary", target: "calendar" },
  );
};

export default breakfastMissing;

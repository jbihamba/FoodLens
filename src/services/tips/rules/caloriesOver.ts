import { TIP_THRESHOLDS } from "@/constants/tips";

import type { TipRule } from "../types";
import { hasEnoughTrackedDays, makeTip } from "./shared";

const caloriesOver: TipRule = (stats) => {
  if (
    !hasEnoughTrackedDays(stats) ||
    stats.current.daysAboveCalorieGoal < TIP_THRESHOLDS.caloriesOverGoalDays
  ) {
    return null;
  }

  return makeTip(
    stats,
    "calories-over-goal",
    "attention",
    "tips.calories.over.title",
    "tips.calories.over.message",
    { days: stats.current.daysAboveCalorieGoal },
    `${stats.current.daysAboveCalorieGoal} / 7`,
    "tips.metric.calories",
    stats.current.daysAboveCalorieGoal - TIP_THRESHOLDS.caloriesOverGoalDays,
  );
};

export default caloriesOver;

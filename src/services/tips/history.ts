import AsyncStorage from "@react-native-async-storage/async-storage";

import { TIP_THRESHOLDS } from "@/constants/tips";

import type { TipHistory } from "./types";

const HISTORY_STORAGE_KEY = "foodlens.tips.history.v1";

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

function parseTipHistory(serialized: string | null): TipHistory {
  if (!serialized) {
    return {
      lastShownAt: {},
      dismissedUntil: {},
      activeRuleIds: [],
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch (cause) {
    throw new Error("Saved tip history is invalid JSON.", { cause });
  }

  if (
    typeof value !== "object" ||
    value === null ||
    !("lastShownAt" in value) ||
    !("dismissedUntil" in value) ||
    !("activeRuleIds" in value) ||
    !isStringRecord(value.lastShownAt) ||
    !isStringRecord(value.dismissedUntil) ||
    !Array.isArray(value.activeRuleIds) ||
    !value.activeRuleIds.every((ruleId) => typeof ruleId === "string")
  ) {
    throw new Error("Saved tip history has an unsupported format.");
  }

  return {
    lastShownAt: value.lastShownAt,
    dismissedUntil: value.dismissedUntil,
    activeRuleIds: value.activeRuleIds,
  };
}

export async function readTipHistory() {
  const serialized = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
  return parseTipHistory(serialized);
}

export async function writeTipHistory(history: TipHistory) {
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

export async function dismissTipRule(ruleId: string, now = new Date()) {
  const history = await readTipHistory();
  const dismissedUntil = new Date(
    now.getTime() + TIP_THRESHOLDS.dismissalCooldownDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const updated: TipHistory = {
    ...history,
    dismissedUntil: {
      ...history.dismissedUntil,
      [ruleId]: dismissedUntil,
    },
    activeRuleIds: history.activeRuleIds.filter(
      (activeId) => activeId !== ruleId,
    ),
  };
  await writeTipHistory(updated);
}

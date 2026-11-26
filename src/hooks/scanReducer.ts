import type { FoodAnalysis } from "@/types/food";
import type { ScanFailureType } from "@/services/scan/scanPipeline";

export type ScanStatus =
  | "capturing"
  | "identifying"
  | "lookingUpNutrition"
  | "done"
  | "lowConfidence"
  | "error";

export interface ScanState {
  status: ScanStatus;
  imageUri: string;
  imageBase64: string;
  analysis: FoodAnalysis | null;
  failure: ScanFailureType | null;
  portion: number;
}

export type ScanAction =
  | { type: "captureStarted" }
  | { type: "captureReady"; imageUri: string; imageBase64: string }
  | { type: "identified"; analysis: FoodAnalysis }
  | { type: "nutritionFound"; analysis: FoodAnalysis }
  | { type: "failed"; failure: ScanFailureType }
  | { type: "portionChanged"; portion: number }
  | { type: "cancelled" };

export const initialScanState: ScanState = {
  status: "capturing",
  imageUri: "",
  imageBase64: "",
  analysis: null,
  failure: null,
  portion: 1,
};

const canAccept = (state: ScanState, action: ScanAction) => {
  if (action.type === "captureStarted") return true;
  if (action.type === "captureReady") return true;
  if (action.type === "identified") return state.status === "identifying";
  if (action.type === "nutritionFound") {
    return state.status === "lookingUpNutrition" || state.status === "lowConfidence";
  }
  return Boolean(state.imageUri) && state.status !== "error";
};

export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  if (!canAccept(state, action)) return state;
  switch (action.type) {
    case "captureStarted":
      return { ...initialScanState, status: "capturing" };
    case "captureReady":
      return {
        ...state,
        status: "identifying",
        imageUri: action.imageUri,
        imageBase64: action.imageBase64,
        analysis: null,
        failure: null,
      };
    case "identified":
      return {
        ...state,
        status:
          action.analysis.confidence !== null && action.analysis.confidence < 0.5
            ? "lowConfidence"
            : "lookingUpNutrition",
        analysis: action.analysis,
        failure: null,
      };
    case "nutritionFound":
      return { ...state, status: "done", analysis: action.analysis };
    case "failed":
      return { ...state, status: "error", failure: action.failure };
    case "portionChanged":
      return { ...state, portion: action.portion };
    case "cancelled":
      return { ...state, status: "error", failure: "cancelled" };
  }
}

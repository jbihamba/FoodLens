import { initialScanState, scanReducer } from "@/hooks/scanReducer";
import type { FoodAnalysis } from "@/types/food";

const analysis: FoodAnalysis = {
  foodName: "Riz au poulet",
  description: "",
  estimatedCalories: 520,
  portionSize: "300 g",
  ingredients: [],
  confidence: 0.9,
};

function identifiedState() {
  return scanReducer(
    scanReducer(initialScanState, { type: "captureReady", imageUri: "photo", imageBase64: "base64" }),
    { type: "identified", analysis },
  );
}

describe("scanReducer", () => {
  it("follows capture, identification, nutrition and done", () => {
    const ready = scanReducer(initialScanState, { type: "captureReady", imageUri: "photo", imageBase64: "base64" });
    expect(ready.status).toBe("identifying");
    const looking = scanReducer(ready, { type: "identified", analysis });
    expect(looking.status).toBe("lookingUpNutrition");
    expect(scanReducer(looking, { type: "nutritionFound", analysis }).status).toBe("done");
  });

  it("rejects events that do not match the current state", () => {
    expect(scanReducer(initialScanState, { type: "nutritionFound", analysis })).toBe(initialScanState);
    const done = scanReducer(identifiedState(), { type: "nutritionFound", analysis });
    expect(scanReducer(done, { type: "identified", analysis })).toBe(done);
  });

  it("keeps the photo when nutrition fails", () => {
    const state = scanReducer(identifiedState(), { type: "failed", failure: "nutritionNotFound" });
    expect(state.status).toBe("error");
    expect(state.imageUri).toBe("photo");
    expect(state.analysis?.foodName).toBe("Riz au poulet");
  });
});

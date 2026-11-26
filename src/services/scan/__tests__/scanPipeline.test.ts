import { runScanPipeline } from "@/services/scan/scanPipeline";
import type { FoodAnalysis } from "@/types/food";

const analysis: FoodAnalysis = {
  foodName: "Salade",
  description: "",
  estimatedCalories: 240,
  portionSize: "250 g",
  ingredients: [],
  confidence: 0.8,
};

describe("runScanPipeline", () => {
  it("emits identification and nutrition for the current one-response API", async () => {
    const events: string[] = [];
    await runScanPipeline({ imageBase64: "x", analyze: async () => analysis }, (event) => events.push(event.type));
    expect(events).toEqual(["identified", "nutritionFound"]);
  });

  it("reports missing nutrition after identification", async () => {
    const events: string[] = [];
    await runScanPipeline({ imageBase64: "x", analyze: async () => ({ ...analysis, estimatedCalories: null }) }, (event) => events.push(event.type));
    expect(events).toEqual(["identified", "failed"]);
  });

  it("reports a timeout without adding a fake progress step", async () => {
    const events: string[] = [];
    await runScanPipeline({ imageBase64: "x", timeoutMs: 1, analyze: (_image, signal) => new Promise<FoodAnalysis>((_, reject) => signal?.addEventListener("abort", () => reject(new Error("aborted")))) }, (event) => events.push(event.type));
    expect(events).toEqual(["failed"]);
  });

  it("ignores late results after cancellation", async () => {
    const controller = new AbortController();
    const events: string[] = [];
    const promise = runScanPipeline({ imageBase64: "x", signal: controller.signal, analyze: async () => { await new Promise((resolve) => setTimeout(resolve, 5)); return analysis; } }, (event) => events.push(event.type));
    controller.abort();
    await promise;
    expect(events).toEqual([]);
  });
});

import { SCAN_ANALYSIS_TIMEOUT_MS } from "@/constants/scan";
import {
  analyzeFoodImage,
  FoodRecognitionError,
} from "@/services/foodRecognition";
import type { FoodAnalysis } from "@/types/food";

export type ScanFailureType =
  | "network"
  | "timeout"
  | "unrecognizedFood"
  | "nutritionNotFound"
  | "cancelled"
  | "unknown";

export type ScanPipelineEvent =
  | { type: "identified"; analysis: FoodAnalysis }
  | { type: "nutritionFound"; analysis: FoodAnalysis }
  | { type: "failed"; failure: ScanFailureType; cause?: unknown };

export interface ScanPipelineInput {
  imageBase64: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  analyze?: typeof analyzeFoodImage;
}

function failureFor(error: unknown): ScanFailureType {
  if (error instanceof FoodRecognitionError) {
    if (error.code === "unrecognized-food") return "unrecognizedFood";
    if (error.code === "network") return "network";
  }
  return "unknown";
}

/**
 * The current API returns identification and nutrition in one JSON response.
 * Consequently the two events are emitted back-to-back, without pretending
 * that an extra network stage exists. A future staged API can replace this
 * implementation while keeping the event contract.
 */
export async function runScanPipeline(
  input: ScanPipelineInput,
  onEvent: (event: ScanPipelineEvent) => void,
): Promise<void> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  input.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(
    abort,
    input.timeoutMs ?? SCAN_ANALYSIS_TIMEOUT_MS,
  );
  const signal = controller.signal;

  try {
    const analysis = await (input.analyze ?? analyzeFoodImage)(
      input.imageBase64,
      signal,
    );
    if (signal.aborted) return;
    onEvent({ type: "identified", analysis });
    if (analysis.estimatedCalories === null) {
      onEvent({ type: "failed", failure: "nutritionNotFound" });
      return;
    }
    onEvent({ type: "nutritionFound", analysis });
  } catch (cause) {
    if (input.signal?.aborted) return;
    onEvent({
      type: "failed",
      failure: signal.aborted ? "timeout" : failureFor(cause),
      cause,
    });
  } finally {
    clearTimeout(timeout);
    input.signal?.removeEventListener("abort", abort);
  }
}

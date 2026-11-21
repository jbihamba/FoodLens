import type { FoodAnalysis } from "@/types/food";

const API_URL = process.env.EXPO_PUBLIC_FOODLENS_API_URL?.trim().replace(
  /\/+$/,
  "",
);

type RecognitionErrorCode =
  | "configuration"
  | "network"
  | "invalid-image"
  | "unrecognized-food"
  | "service";

export class FoodRecognitionError extends Error {
  constructor(
    message: string,
    readonly code: RecognitionErrorCode,
  ) {
    super(message);
    this.name = "FoodRecognitionError";
  }
}

interface ApiError {
  error?: {
    code?: string;
  };
}

function isFoodAnalysis(value: unknown): value is FoodAnalysis {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Record<string, unknown>;
  return (
    typeof result.foodName === "string" &&
    typeof result.description === "string" &&
    (typeof result.estimatedCalories === "number" ||
      result.estimatedCalories === null) &&
    (typeof result.portionSize === "string" || result.portionSize === null) &&
    Array.isArray(result.ingredients) &&
    result.ingredients.every((ingredient) => typeof ingredient === "string") &&
    (typeof result.confidence === "number" || result.confidence === null)
  );
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause =
    error.cause instanceof Error
      ? `${error.cause.name}: ${error.cause.message}`
      : "";
  return /\btimeout\b|\btimed out\b/i.test(
    `${error.name}: ${error.message} ${cause}`,
  );
}

export async function analyzeFoodImage(
  imageBase64: string,
  signal?: AbortSignal,
): Promise<FoodAnalysis> {
  if (!API_URL) {
    throw new FoodRecognitionError(
      "FoodLens is not connected to its analysis service yet.",
      "configuration",
    );
  }
  if (!imageBase64.trim()) {
    throw new FoodRecognitionError(
      "Choose a food photo before analyzing.",
      "invalid-image",
    );
  }

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => controller.abort(), 100_000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/v1/food/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
      signal: controller.signal,
    });
  } catch (error) {
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "Unknown network error";
    console.error("[food-recognition] Analysis request failed:", error);
    if (controller.signal.aborted || isTimeoutError(error)) {
      throw new FoodRecognitionError(
        "Meal analysis timed out. Please check the server and try again.",
        "network",
      );
    }
    throw new FoodRecognitionError(
      __DEV__
        ? `We could not reach FoodLens (${detail}). Check your connection and try again.`
        : "We could not reach FoodLens. Check your connection and try again.",
      "network",
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }

  if (!response.ok) {
    let errorCode = "";
    try {
      const body = (await response.json()) as ApiError;
      errorCode = body.error?.code ?? "";
    } catch {
      errorCode = "";
    }

    if (errorCode === "unrecognized_food") {
      throw new FoodRecognitionError(
        "We could not recognize food in this photo. Try a clearer picture of your meal.",
        "unrecognized-food",
      );
    }
    if (errorCode === "invalid_image") {
      throw new FoodRecognitionError(
        "That photo could not be analyzed. Choose a different image and try again.",
        "invalid-image",
      );
    }
    if (errorCode === "rate_limited") {
      throw new FoodRecognitionError(
        "You have made several scans recently. Please wait a moment and try again.",
        "service",
      );
    }
    throw new FoodRecognitionError(
      "FoodLens could not analyze that photo right now. Please try again shortly.",
      "service",
    );
  }

  let body: { analysis?: unknown };
  try {
    body = (await response.json()) as { analysis?: unknown };
  } catch {
    throw new FoodRecognitionError(
      "FoodLens returned an unexpected result.",
      "service",
    );
  }

  if (!isFoodAnalysis(body.analysis)) {
    throw new FoodRecognitionError(
      "FoodLens returned an unexpected result.",
      "service",
    );
  }
  return body.analysis;
}

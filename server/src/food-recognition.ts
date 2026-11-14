const GEMINI_GENERATE_CONTENT_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const MAX_IMAGE_BASE64_LENGTH = 6_000_000;

export interface FoodAnalysis {
  foodName: string;
  description: string;
  estimatedCalories: number | null;
  portionSize: string | null;
  ingredients: string[];
  confidence: number | null;
}

interface ParsedFoodAnalysis extends FoodAnalysis {
  isFood: boolean;
}

export class RecognitionError extends Error {
  constructor(
    readonly code: 'invalid_image' | 'unrecognized_food' | 'provider_error',
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'RecognitionError';
  }
}

export function decodeJpegBase64(value: unknown): Buffer {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_IMAGE_BASE64_LENGTH ||
    value.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) {
    throw new RecognitionError('invalid_image', 400, 'Choose a valid JPEG image.');
  }

  const image = Buffer.from(value, 'base64');
  if (
    image.toString('base64') !== value ||
    image.length < 4 ||
    image[0] !== 0xff ||
    image[1] !== 0xd8 ||
    image[image.length - 2] !== 0xff ||
    image[image.length - 1] !== 0xd9
  ) {
    throw new RecognitionError('invalid_image', 400, 'Choose a valid JPEG image.');
  }
  return image;
}

function isFoodAnalysis(value: unknown): value is ParsedFoodAnalysis {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const result = value as Record<string, unknown>;
  return (
    result.isFood === true &&
    typeof result.foodName === 'string' &&
    result.foodName.trim().length > 0 &&
    result.foodName.length <= 120 &&
    typeof result.description === 'string' &&
    result.description.trim().length > 0 &&
    result.description.length <= 500 &&
    (typeof result.estimatedCalories === 'number' ||
      result.estimatedCalories === null) &&
    (result.estimatedCalories === null ||
      (Number.isInteger(result.estimatedCalories) &&
        result.estimatedCalories >= 0 &&
        result.estimatedCalories <= 10_000)) &&
    (typeof result.portionSize === 'string' || result.portionSize === null) &&
    (result.portionSize === null || result.portionSize.length <= 40) &&
    Array.isArray(result.ingredients) &&
    result.ingredients.length <= 12 &&
    result.ingredients.every(
      (ingredient) => typeof ingredient === 'string' && ingredient.length <= 80,
    ) &&
    (typeof result.confidence === 'number' || result.confidence === null) &&
    (result.confidence === null ||
      (Number.isFinite(result.confidence) &&
        result.confidence >= 0 &&
        result.confidence <= 1))
  );
}

function extractOutputText(response: unknown): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const candidates = (response as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) {
    return null;
  }

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }
    const content = (candidate as { content?: unknown }).content;
    if (!content || typeof content !== 'object') {
      continue;
    }
    const parts = (content as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      if (
        part &&
        typeof part === 'object' &&
        typeof (part as { text?: unknown }).text === 'string'
      ) {
        return (part as { text: string }).text;
      }
    }
  }
  return null;
}

const foodSchema = {
  type: 'OBJECT',
  properties: {
    isFood: { type: 'BOOLEAN' },
    foodName: { type: 'STRING' },
    description: { type: 'STRING' },
    estimatedCalories: { type: 'INTEGER', nullable: true },
    portionSize: { type: 'STRING', nullable: true },
    ingredients: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    confidence: { type: 'NUMBER', nullable: true },
  },
  required: [
    'isFood',
    'foodName',
    'description',
    'estimatedCalories',
    'portionSize',
    'ingredients',
    'confidence',
  ],
};

export async function recognizeFood(
  imageBase64: string,
  apiKey: string,
  model = DEFAULT_MODEL,
): Promise<FoodAnalysis> {
  decodeJpegBase64(imageBase64);

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_GENERATE_CONTENT_URL}/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  'You analyze meal photos for a food diary. If any edible food is visibly present, set isFood true even when the exact dish is uncertain; use a simple generic food name rather than rejecting the photo. Set isFood false only when the image clearly contains no edible food. Never claim nutritional certainty. Estimate total calories for recognizable meal components; if the portion or preparation is too unclear, use null for calories or portion size rather than inventing precision. List only identifiable main ingredients. Confidence is an approximate visual-match score from 0 to 1, not a calibrated probability. When isFood is false, use an empty foodName and ingredients, null calories, portion size, and confidence, and briefly explain in description.',
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Identify the meal and estimate its total energy and portion from this photo.',
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: foodSchema,
            maxOutputTokens: 500,
            thinkingConfig: {
              thinkingLevel: 'LOW',
            },
          },
        }),
      },
    );
  } catch (error) {
    const errorDetail = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error';
    const causeDetail =
      error instanceof Error && error.cause instanceof Error
        ? `; ${error.cause.name}: ${error.cause.message}`
        : '';
    console.error(
      `[food-recognition] Gemini request failed: ${(errorDetail + causeDetail).slice(0, 500)}`,
    );
    throw new RecognitionError(
      'provider_error',
      502,
      'Meal analysis is temporarily unavailable.',
    );
  }

  if (!response.ok) {
    let providerMessage = '';
    try {
      const body = (await response.json()) as {
        error?: { message?: unknown };
      };
      if (typeof body.error?.message === 'string') {
        providerMessage = body.error.message.slice(0, 500);
      }
    } catch {
      providerMessage = 'Gemini returned a non-JSON error body.';
    }
    console.error(
      `[food-recognition] Gemini returned HTTP ${response.status}${providerMessage ? `: ${providerMessage}` : '.'}`,
    );
    throw new RecognitionError(
      'provider_error',
      502,
      'Meal analysis is temporarily unavailable.',
    );
  }

  let providerResponse: unknown;
  try {
    providerResponse = await response.json();
  } catch {
    console.error('[food-recognition] Gemini returned an invalid response body.');
    throw new RecognitionError(
      'provider_error',
      502,
      'Meal analysis returned an invalid response.',
    );
  }

  const outputText = extractOutputText(providerResponse);
  if (!outputText) {
    throw new RecognitionError(
      'provider_error',
      502,
      'Meal analysis did not return a usable result.',
    );
  }

  let result: unknown;
  try {
    result = JSON.parse(outputText);
  } catch {
    throw new RecognitionError(
      'provider_error',
      502,
      'Meal analysis returned an invalid result.',
    );
  }

  if (
    result &&
    typeof result === 'object' &&
    (result as Record<string, unknown>).isFood === false
  ) {
    throw new RecognitionError(
      'unrecognized_food',
      422,
      'No recognizable food was found in the photo.',
    );
  }

  if (!isFoodAnalysis(result)) {
    throw new RecognitionError(
      'provider_error',
      502,
      'Meal analysis returned an invalid result.',
    );
  }

  const { isFood: _isFood, ...analysis } = result;
  return analysis;
}

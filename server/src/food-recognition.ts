const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-6-luna';
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

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const part of content) {
      if (
        part &&
        typeof part === 'object' &&
        (part as { type?: unknown }).type === 'output_text' &&
        typeof (part as { text?: unknown }).text === 'string'
      ) {
        return (part as { text: string }).text;
      }
      if (
        part &&
        typeof part === 'object' &&
        (part as { type?: unknown }).type === 'refusal'
      ) {
        return null;
      }
    }
  }
  return null;
}

const foodSchema = {
  type: 'object',
  properties: {
    isFood: { type: 'boolean' },
    foodName: { type: 'string' },
    description: { type: 'string' },
    estimatedCalories: {
      anyOf: [{ type: 'integer' }, { type: 'null' }],
    },
    portionSize: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    },
    ingredients: {
      type: 'array',
      items: { type: 'string' },
    },
    confidence: {
      anyOf: [{ type: 'number' }, { type: 'null' }],
    },
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
  additionalProperties: false,
};

export async function recognizeFood(
  imageBase64: string,
  apiKey: string,
  model = DEFAULT_MODEL,
): Promise<FoodAnalysis> {
  decodeJpegBase64(imageBase64);

  let response: Response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(55_000),
      body: JSON.stringify({
        model,
        reasoning: { effort: 'low' },
        input: [
          {
            role: 'system',
            content:
              'You analyze meal photos for a food diary. Report only foods clearly supported by the image. Never claim nutritional certainty. Estimate total calories for all recognizable meal components; if the portion or preparation is too unclear, use null for calories or portion size rather than inventing precision. List only identifiable main ingredients. Confidence is an approximate visual-match score from 0 to 1, not a calibrated probability. If no recognizable food is present, set isFood false, use empty foodName and ingredients, null calories, portion size, and confidence, and briefly explain in description.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Identify the meal and estimate its total energy and portion from this photo.',
              },
              {
                type: 'input_image',
                image_url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'auto',
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'food_analysis',
            strict: true,
            schema: foodSchema,
          },
        },
        max_output_tokens: 800,
      }),
    });
  } catch {
    console.error('[food-recognition] OpenAI request failed to connect.');
    throw new RecognitionError(
      'provider_error',
      502,
      'Meal analysis is temporarily unavailable.',
    );
  }

  if (!response.ok) {
    console.error(`[food-recognition] OpenAI returned HTTP ${response.status}.`);
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
    console.error('[food-recognition] OpenAI returned an invalid response body.');
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

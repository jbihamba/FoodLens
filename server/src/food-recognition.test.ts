import assert from 'node:assert/strict';
import test from 'node:test';

import { decodeJpegBase64, recognizeFood } from './food-recognition.js';

const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');

test('accepts a JPEG base64 payload', () => {
  assert.equal(decodeJpegBase64(jpegBase64).toString('hex'), 'ffd8ffd9');
});

test('rejects non-image and malformed base64 payloads', () => {
  assert.throws(() => decodeJpegBase64('bm90IGFuIGltYWdl'), {
    code: 'invalid_image',
  });
  assert.throws(() => decodeJpegBase64('%%not-base64%%'), {
    code: 'invalid_image',
  });
  assert.throws(() => decodeJpegBase64(''), {
    code: 'invalid_image',
  });
});

test('returns validated structured analysis from the vision response', async () => {
  const originalFetch = globalThis.fetch;
  const result = {
    isFood: true,
    foodName: 'Grilled chicken with rice',
    description: 'Grilled chicken served with rice.',
    estimatedCalories: 520,
    portionSize: '350 g',
    ingredients: ['Chicken', 'Rice'],
    confidence: 0.88,
  };
  globalThis.fetch = async (input, init) => {
    assert.equal(
      input,
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
    );
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'test-key');
    const requestBody = JSON.parse(String(init?.body));
    assert.equal(requestBody.generationConfig.responseMimeType, 'application/json');
    assert.equal(requestBody.contents[0].parts[1].inlineData.data, jpegBase64);
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(result) }],
            },
          },
        ],
      }),
      { status: 200 },
    );
  };

  try {
    const analysis = await recognizeFood(jpegBase64, 'test-key');
    assert.deepEqual(analysis, {
      foodName: result.foodName,
      description: result.description,
      estimatedCalories: result.estimatedCalories,
      portionSize: result.portionSize,
      ingredients: result.ingredients,
      confidence: result.confidence,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('returns an explicit error for photos without recognizable food', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    isFood: false,
                    foodName: '',
                    description: 'No recognizable food is visible.',
                    estimatedCalories: null,
                    portionSize: null,
                    ingredients: [],
                    confidence: null,
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200 },
    );

  try {
    await assert.rejects(recognizeFood(jpegBase64, 'test-key'), {
      code: 'unrecognized_food',
      status: 422,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

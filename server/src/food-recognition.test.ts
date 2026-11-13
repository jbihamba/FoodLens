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
    assert.equal(input, 'https://api.openai.com/v1/responses');
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test-key');
    return new Response(
      JSON.stringify({
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: JSON.stringify(result) }],
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
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
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

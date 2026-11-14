import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';

import { decodeJpegBase64, RecognitionError, recognizeFood } from './food-recognition.js';

const MAX_BODY_BYTES = 7_000_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 8;
const PORT = Number(process.env.PORT ?? 3001);

interface RateLimitBucket {
  expiresAt: number;
  requests: number;
}

class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bytes.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new RequestError(413, 'payload_too_large', 'Photo is too large to analyze.');
    }
    chunks.push(bytes);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new RequestError(400, 'invalid_request', 'Request must contain valid JSON.');
  }
}

function createRateLimiter() {
  const buckets = new Map<string, RateLimitBucket>();
  return (key: string) => {
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || current.expiresAt <= now) {
      buckets.set(key, { expiresAt: now + RATE_LIMIT_WINDOW_MS, requests: 1 });
      return true;
    }
    current.requests += 1;
    return current.requests <= RATE_LIMIT_REQUESTS;
  };
}

export function createAppServer() {
  const allowRequest = createRateLimiter();
  return createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { status: 'ok' });
      return;
    }

    if (request.method !== 'POST' || request.url !== '/v1/food/analyze') {
      sendJson(response, 404, { error: { code: 'not_found', message: 'Route not found.' } });
      return;
    }

    const ipAddress = request.socket.remoteAddress ?? 'unknown';
    if (!allowRequest(ipAddress)) {
      sendJson(response, 429, {
        error: {
          code: 'rate_limited',
          message: 'Too many meal scans. Please wait a moment and try again.',
        },
      });
      return;
    }

    if (!request.headers['content-type']?.includes('application/json')) {
      sendJson(response, 415, {
        error: { code: 'invalid_request', message: 'Request must use JSON.' },
      });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const imageBase64 =
        body && typeof body === 'object'
          ? (body as { imageBase64?: unknown }).imageBase64
          : undefined;
      if (typeof imageBase64 !== 'string') {
        throw new RecognitionError('invalid_image', 400, 'Choose a valid JPEG image.');
      }
      decodeJpegBase64(imageBase64);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('[food-recognition] GEMINI_API_KEY is not configured.');
        sendJson(response, 503, {
          error: {
            code: 'service_unavailable',
            message: 'Meal analysis is not configured yet.',
          },
        });
        return;
      }

      const model = process.env.GEMINI_MODEL?.trim() || undefined;
      const analysis = await recognizeFood(imageBase64, apiKey, model);
      sendJson(response, 200, { analysis });
    } catch (error) {
      if (error instanceof RecognitionError || error instanceof RequestError) {
        sendJson(response, error.status, {
          error: { code: error.code, message: error.message },
        });
        return;
      }

      console.error(
        '[food-recognition] Unexpected request failure.',
        error instanceof Error ? error.message : 'Unknown error',
      );
      sendJson(response, 500, {
        error: {
          code: 'internal_error',
          message: 'Meal analysis could not be completed.',
        },
      });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createAppServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.info(`FoodLens API listening on port ${PORT}.`);
  });
}

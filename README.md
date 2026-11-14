# FoodLens

FoodLens is an Expo / React Native app that estimates the foods and calories in a meal photo. Calorie and portion values are approximate and may vary with ingredients, serving size, and preparation.

## Mobile app

```sh
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_FOODLENS_API_URL` in the root `.env` to the reachable API address (the local API listens on port `3001`). For a physical phone, use your computer's LAN IP; Android emulators generally reach the host computer at `10.0.2.2`. Do not put an AI provider key in this file.

```sh
npx expo start
```

The app uses Expo Router for a home → scanner → result flow. Camera capture, gallery selection, and JPEG resizing use the SDK-compatible Expo ImagePicker and ImageManipulator packages.
The interface uses NativeWind/Tailwind utility classes across iOS, Android, and web; web bundling is configured to use Metro.

## Recognition API

The separate TypeScript API forwards validated meal photos to Google's Gemini API using the `gemini-3.1-flash-lite` model by default. It requires Node.js 20.6+ and does not store images or require a database.

```sh
cd server
npm install
cp .env.example .env
```

Set `GEMINI_API_KEY` in `server/.env` (or as a server environment secret), then run the API in a separate terminal:

```sh
npm run dev
```

The app sends a compressed JPEG as base64 JSON to `POST /v1/food/analyze`. The API validates the image, rate-limits requests per process, requests schema-constrained model output, and returns a friendly error for images without recognizable food. The `GET /health` endpoint can be used to check server availability.

For deployment, configure `GEMINI_API_KEY` as a secret, set `EXPO_PUBLIC_FOODLENS_API_URL` to the public API origin, and configure an edge/host-level rate limit. The included process-level limit is useful for local development but is not shared between server instances. Google processes submitted photos under its service terms.

## Checks

```sh
npx expo lint
npx tsc --noEmit
cd server && npm run typecheck && npm test
```

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

The app uses Expo Router for a home → scanner → result flow. The scanner uses Expo Camera for a live camera preview and capture, Expo ImagePicker for gallery selection, and ImageManipulator to prepare images for analysis.
The interface uses NativeWind/Tailwind utility classes across iOS, Android, and web; web bundling is configured to use Metro.

Daily calorie goals and logged meals are stored locally in the `foodlens.db` SQLite database. The app starts with a 2,000 kcal goal; scan a meal and choose **Log this meal** to include its estimate in today's total. Edit or remove today's entries from the home screen, or change the goal with **Edit** on the Daily Goal card. Meal timestamps are stored in ISO 8601 UTC and grouped by the device's local calendar day.
Open **Calendar** on the home screen to browse monthly meal history, daily calorie totals, and goal completion. Calendar history is read from the same local database and does not change existing meals.

Open **Settings** from the home screen to choose light, dark, or system appearance; English or French; and metric or imperial serving-size units. Preferences and the editable display profile are saved locally in the existing SQLite database. Calories remain in kcal and nutrient quantities remain in grams regardless of the serving-size unit preference. Clearing local data requires confirmation, removes meal history and profile details, and resets the daily goal while preserving appearance, language, unit, and onboarding preferences. The storage estimate covers meal records and does not include cached image files or SQLite overhead. Meal photos are sent to the configured recognition service for analysis; that service may forward images to Google.
Web development and Expo Hosting are configured with the cross-origin isolation headers required by Expo SQLite.

## Fitness training module

The Fitness module is available from the **Fitness** tab. It includes muscle-group categories, workout plans, exercise details, active sessions, workout summaries, and training history.

### Exercise demonstrations

Each seeded exercise has its own locally bundled visual asset:

- Exercise cards use a specific JPEG photograph of a person performing the corresponding movement.
- Category and workout-plan cards use photographs associated with the targeted muscle group.
- Exercise details and active sessions prioritize the existing animated GIF demonstration when available, then use the exercise photo as a fallback.
- MP4 demonstrations remain supported through `expo-video` when media metadata points to an MP4 source.

The media component supports loading states, looping and muted playback for videos, pause/resume controls, image error handling, and a neutral unavailable state. Workout timers and media playback are independent, so pausing a demonstration does not pause the workout timer.

All JPEGs and GIFs are bundled under [`assets/exercises/`](assets/exercises/), which keeps the Fitness visuals available offline. The static registry is [`src/constants/exerciseMedia.ts`](src/constants/exerciseMedia.ts); UI components are [`ExerciseMediaDemo.tsx`](src/components/workout/ExerciseMediaDemo.tsx), [`ExerciseThumbnail.tsx`](src/components/workout/ExerciseThumbnail.tsx), and [`WorkoutCategoryPhoto.tsx`](src/components/workout/WorkoutCategoryPhoto.tsx).

Media sources, licenses, and required attributions are recorded in [`assets/exercises/SOURCES.md`](assets/exercises/SOURCES.md). The exercise media registry is separate from workout session progress and does not require a duplicate exercise table.

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

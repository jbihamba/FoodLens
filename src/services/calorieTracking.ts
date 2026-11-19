import type { SQLiteDatabase } from 'expo-sqlite';

export const DEFAULT_DAILY_GOAL = 2000;
export const MAX_DAILY_GOAL = 10000;

export interface DailyGoal {
  id: number;
  target_calories: number;
  created_at: string;
  updated_at: string;
}

export interface FoodEntry {
  id: number;
  food_name: string;
  calories: number;
  meal_type: string | null;
  image_uri: string | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  consumed_at: string;
}

export interface FoodEntryInput {
  foodName: string;
  calories: number;
  mealType?: string | null;
  imageUri?: string | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
}

export function getLocalDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function initializeCalorieDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_calories INTEGER NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS food_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name TEXT NOT NULL,
      calories REAL NOT NULL,
      meal_type TEXT,
      image_uri TEXT,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      consumed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS food_entries_consumed_at_idx
      ON food_entries (consumed_at);
  `);

  const foodEntryColumns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(food_entries)',
  );
  const existingColumns = new Set(foodEntryColumns.map((column) => column.name));
  const optionalColumns = [
    ['image_uri', 'TEXT'],
    ['protein_g', 'REAL'],
    ['carbs_g', 'REAL'],
    ['fat_g', 'REAL'],
  ] as const;
  for (const [column, type] of optionalColumns) {
    if (!existingColumns.has(column)) {
      await db.execAsync(`ALTER TABLE food_entries ADD COLUMN ${column} ${type}`);
    }
  }

  const goal = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM daily_goals ORDER BY id DESC LIMIT 1',
  );
  if (!goal) {
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO daily_goals (target_calories, created_at, updated_at) VALUES (?, ?, ?)',
      DEFAULT_DAILY_GOAL,
      now,
      now,
    );
  }
}

export async function hasCompletedOnboarding(db: SQLiteDatabase) {
  const preference = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_preferences WHERE key = ?',
    'onboarding_completed',
  );
  return preference?.value === 'true';
}

export async function completeOnboarding(db: SQLiteDatabase) {
  await db.runAsync(
    'INSERT OR REPLACE INTO app_preferences (key, value) VALUES (?, ?)',
    'onboarding_completed',
    'true',
  );
}

export async function getDailyGoal(db: SQLiteDatabase) {
  return db.getFirstAsync<DailyGoal>(
    'SELECT id, target_calories, created_at, updated_at FROM daily_goals ORDER BY id DESC LIMIT 1',
  );
}

export async function updateDailyGoal(db: SQLiteDatabase, targetCalories: number) {
  if (
    !Number.isInteger(targetCalories) ||
    targetCalories < 1 ||
    targetCalories > MAX_DAILY_GOAL
  ) {
    throw new Error(`Enter a whole number between 1 and ${MAX_DAILY_GOAL} kcal.`);
  }

  const now = new Date().toISOString();
  const goal = await getDailyGoal(db);
  if (goal) {
    await db.runAsync(
      'UPDATE daily_goals SET target_calories = ?, updated_at = ? WHERE id = ?',
      targetCalories,
      now,
      goal.id,
    );
  } else {
    await db.runAsync(
      'INSERT INTO daily_goals (target_calories, created_at, updated_at) VALUES (?, ?, ?)',
      targetCalories,
      now,
      now,
    );
  }
}

export async function getFoodEntriesForLocalDay(db: SQLiteDatabase, date = new Date()) {
  const { start, end } = getLocalDayRange(date);
  return db.getAllAsync<FoodEntry>(
    `SELECT id, food_name, calories, meal_type, image_uri, protein_g, carbs_g, fat_g, consumed_at
     FROM food_entries
     WHERE consumed_at >= ? AND consumed_at < ?
     ORDER BY consumed_at DESC, id DESC`,
    start,
    end,
  );
}

export async function getFoodEntriesForLocalMonth(db: SQLiteDatabase, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return db.getAllAsync<FoodEntry>(
    `SELECT id, food_name, calories, meal_type, image_uri, protein_g, carbs_g, fat_g, consumed_at
     FROM food_entries
     WHERE consumed_at >= ? AND consumed_at < ?
     ORDER BY consumed_at DESC, id DESC`,
    start.toISOString(),
    end.toISOString(),
  );
}

export async function getFoodEntry(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<FoodEntry>(
    `SELECT id, food_name, calories, meal_type, image_uri, protein_g, carbs_g, fat_g, consumed_at
     FROM food_entries WHERE id = ?`,
    id,
  );
}

function validateFoodEntry(entry: FoodEntryInput) {
  if (!entry.foodName.trim()) {
    throw new Error('Enter a name for this meal.');
  }
  if (!Number.isFinite(entry.calories) || entry.calories <= 0) {
    throw new Error('Calories must be a positive number.');
  }
  const nutrients = [
    ['Protein', entry.proteinG],
    ['Carbohydrates', entry.carbsG],
    ['Fat', entry.fatG],
  ] as const;
  for (const [name, value] of nutrients) {
    if (value != null && (!Number.isFinite(value) || value < 0)) {
      throw new Error(`${name} must be a non-negative number.`);
    }
  }
}

export async function addFoodEntry(db: SQLiteDatabase, entry: FoodEntryInput) {
  validateFoodEntry(entry);
  const result = await db.runAsync(
    `INSERT INTO food_entries
      (food_name, calories, meal_type, image_uri, protein_g, carbs_g, fat_g, consumed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.foodName.trim(),
    entry.calories,
    entry.mealType?.trim() || null,
    entry.imageUri?.trim() || null,
    entry.proteinG ?? null,
    entry.carbsG ?? null,
    entry.fatG ?? null,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

export async function updateFoodEntry(
  db: SQLiteDatabase,
  id: number,
  entry: FoodEntryInput,
) {
  validateFoodEntry(entry);
  await db.runAsync(
    `UPDATE food_entries
     SET food_name = ?, calories = ?, meal_type = ?, image_uri = ?,
       protein_g = ?, carbs_g = ?, fat_g = ?
     WHERE id = ?`,
    entry.foodName.trim(),
    entry.calories,
    entry.mealType?.trim() || null,
    entry.imageUri?.trim() || null,
    entry.proteinG ?? null,
    entry.carbsG ?? null,
    entry.fatG ?? null,
    id,
  );
}

export async function deleteFoodEntry(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM food_entries WHERE id = ?', id);
}

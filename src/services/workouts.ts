import type { SQLiteDatabase } from "expo-sqlite";

import type {
  ExerciseStatus,
  WorkoutCategory,
  WorkoutDifficulty,
  ExerciseDetails,
  WorkoutPlan,
  WorkoutPlanExercise,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutStats,
} from "@/types/workout";

const WORKOUT_SCHEMA_VERSION = 3;

const exerciseMediaSeed = [
  ["Bodyweight Squat", "gif", "bodyweight-squat", "https://commons.wikimedia.org/wiki/File:Squats_01.gif", "CC BY 3.0", "Zimmermanns"],
  ["Push-up", "gif", "push-up", "https://commons.wikimedia.org/wiki/File:Liegestuetz02_ani_fcm.gif", "CC BY-SA 4.0", "Frank C. Müller"],
  ["Calf Raise", "gif", "calf-raise", "https://commons.wikimedia.org/wiki/File:Standing-calf-raises-1.gif", "CC BY-SA 3.0", "Everkinetic"],
  ["Jumping Jack", "gif", "jumping-jack", "https://commons.wikimedia.org/wiki/File:Vitruvian_jumping_jacks.gif", "Public domain", "Damian Yerrick"],
] as const;

const categories = [
  ["legs", "Legs", "Build strength and control from the ground up.", "🦵", "#EAF5E8"],
  ["chest", "Chest", "Simple, focused pushing movements.", "💪", "#EDF5F0"],
  ["back", "Back", "Posture-friendly pulling and upper-back work.", "🏋️", "#F2F0E8"],
  ["arms", "Arms", "Efficient biceps and triceps sessions.", "🔥", "#FFF3E8"],
  ["shoulders", "Shoulders", "Controlled overhead strength work.", "🎯", "#EAF0F5"],
  ["abs", "Abs", "Core stability and body control.", "⚡", "#FFF6E7"],
  ["glutes", "Glutes", "Steady lower-body movement and activation.", "🍑", "#F6EAF2"],
  ["calves", "Calves", "A short, focused lower-leg session.", "🦶", "#EDF5F0"],
  ["full-body", "Full Body", "A balanced session for busy days.", "🌿", "#EAF5E8"],
  ["cardio", "Cardio", "Low-equipment movement to raise your pace.", "❤️", "#FDECEC"],
] as const;

const exerciseSeed = [
  ["Bodyweight Squat", "A controlled squat using your body weight.", "Stand tall, sit hips back, then drive through your feet.", "None", "Quadriceps · Glutes · Hamstrings"],
  ["Push-up", "A classic horizontal push movement.", "Keep your body in one line and lower with control.", "None", "Chest · Triceps · Shoulders"],
  ["Bent-over Row", "A back-focused pulling movement.", "Hinge at the hips, keep your back neutral, and pull elbows back.", "Dumbbell or household weight", "Upper back · Lats · Biceps"],
  ["Reverse Lunge", "An alternating single-leg movement.", "Step back softly and keep the front knee tracking over the foot.", "None", "Glutes · Quadriceps · Hamstrings"],
  ["Plank", "A static core stability hold.", "Brace your middle and breathe steadily without dropping your hips.", "None", "Abdominals · Shoulders · Glutes"],
  ["Glute Bridge", "A floor-based hip extension movement.", "Press through your heels and pause briefly at the top.", "None", "Glutes · Hamstrings · Core"],
  ["Calf Raise", "A controlled lower-leg strength movement.", "Rise onto the balls of your feet, pause, and lower slowly.", "None", "Calves"],
  ["March in Place", "A simple rhythmic cardio movement.", "Stand tall and alternate lifting your knees at a comfortable pace.", "None", "Hip flexors · Calves · Core"],
  ["Jumping Jack", "A light full-body cardio movement.", "Move smoothly and choose a step-out version if needed.", "None", "Full body · Calves · Shoulders"],
  ["Shoulder Press", "An overhead pressing movement.", "Press evenly overhead while keeping ribs comfortably down.", "Dumbbell or household weight", "Shoulders · Triceps · Upper chest"],
] as const;

function now() { return new Date().toISOString(); }

export async function initializeWorkoutDatabase(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      description TEXT NOT NULL, icon TEXT NOT NULL, accent TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL,
      instructions TEXT NOT NULL, equipment TEXT, image_uri TEXT, targeted_muscles TEXT NOT NULL DEFAULT 'Full body', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exercise_media (
      exercise_id INTEGER PRIMARY KEY REFERENCES exercises(id) ON DELETE CASCADE,
      media_type TEXT NOT NULL CHECK (media_type IN ('image','gif','mp4')),
      source_uri TEXT, asset_key TEXT, poster_uri TEXT, source TEXT, license TEXT, attribution TEXT,
      CHECK (source_uri IS NOT NULL OR asset_key IS NOT NULL)
    );
    CREATE TABLE IF NOT EXISTS workout_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER NOT NULL REFERENCES workout_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL, description TEXT NOT NULL, difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workout_plan_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id INTEGER NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT, exercise_order INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL, repetitions INTEGER, rest_seconds INTEGER NOT NULL,
      UNIQUE(plan_id, exercise_order)
    );
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id INTEGER NOT NULL REFERENCES workout_plans(id) ON DELETE RESTRICT,
      started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL CHECK (status IN ('active','completed','abandoned')),
      paused_seconds INTEGER NOT NULL DEFAULT 0, total_rest_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workout_session_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT, session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT, exercise_order INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL, rest_seconds INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
      started_at TEXT, completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS workout_plans_category_idx ON workout_plans(category_id);
    CREATE INDEX IF NOT EXISTS workout_plan_exercises_plan_idx ON workout_plan_exercises(plan_id, exercise_order);
    CREATE INDEX IF NOT EXISTS workout_sessions_started_idx ON workout_sessions(started_at);
    CREATE INDEX IF NOT EXISTS workout_session_exercises_session_idx ON workout_session_exercises(session_id, exercise_order);
  `);
  const version = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_preferences WHERE key = ?", "workout_schema_version");
  if (Number(version?.value ?? 0) >= WORKOUT_SCHEMA_VERSION) return;
  await db.withTransactionAsync(async () => {
    const timestamp = now();
    const exerciseColumns = await db.getAllAsync<{ name: string }>("PRAGMA table_info(exercises)");
    if (!exerciseColumns.some((column) => column.name === "targeted_muscles")) {
      await db.execAsync("ALTER TABLE exercises ADD COLUMN targeted_muscles TEXT NOT NULL DEFAULT 'Full body'");
    }
    const mediaColumns = await db.getAllAsync<{ name: string }>("PRAGMA table_info(exercise_media)");
    for (const column of ["source", "license", "attribution"]) {
      if (!mediaColumns.some((item) => item.name === column)) await db.execAsync(`ALTER TABLE exercise_media ADD COLUMN ${column} TEXT`);
    }
    for (const [slug, name, description, icon, accent] of categories) {
      await db.runAsync("INSERT OR IGNORE INTO workout_categories (slug,name,description,icon,accent,created_at,updated_at) VALUES (?,?,?,?,?,?,?)", slug, name, description, icon, accent, timestamp, timestamp);
    }
    for (const [name, description, instructions, equipment, targetedMuscles] of exerciseSeed) {
      await db.runAsync("INSERT OR IGNORE INTO exercises (name,description,instructions,equipment,targeted_muscles,created_at,updated_at) VALUES (?,?,?,?,?,?,?)", name, description, instructions, equipment, targetedMuscles, timestamp, timestamp);
      await db.runAsync("UPDATE exercises SET targeted_muscles=?,updated_at=? WHERE name=?", targetedMuscles, timestamp, name);
    }
    for (const [exerciseName, mediaType, assetKey, source, license, attribution] of exerciseMediaSeed) {
      const exercise = await db.getFirstAsync<{ id: number }>("SELECT id FROM exercises WHERE name=?", exerciseName);
      if (exercise) await db.runAsync("INSERT OR REPLACE INTO exercise_media (exercise_id,media_type,source_uri,asset_key,poster_uri,source,license,attribution) VALUES (?,?,?,?,?,?,?,?)", exercise.id, mediaType, null, assetKey, null, source, license, attribution);
    }
    const plans: Array<[string, string, string, WorkoutDifficulty, string[]]> = [
      ["legs", "Leg strength basics", "A steady lower-body foundation.", "beginner", ["Bodyweight Squat", "Reverse Lunge", "Calf Raise"]],
      ["chest", "Chest foundations", "A simple push-focused session.", "beginner", ["Push-up", "Plank", "Push-up"]],
      ["back", "Back & posture", "Controlled pulling and trunk control.", "beginner", ["Bent-over Row", "Plank", "Bent-over Row"]],
      ["arms", "Arm builder", "Focused upper-limb work.", "intermediate", ["Push-up", "Bent-over Row", "Push-up"]],
      ["shoulders", "Shoulder control", "A measured overhead session.", "intermediate", ["Shoulder Press", "Plank", "Shoulder Press"]],
      ["abs", "Core control", "Short, repeatable core practice.", "beginner", ["Plank", "Glute Bridge", "Plank"]],
      ["glutes", "Glute foundation", "Steady hip extension and leg work.", "beginner", ["Glute Bridge", "Reverse Lunge", "Bodyweight Squat"]],
      ["calves", "Calf focus", "A compact lower-leg session.", "beginner", ["Calf Raise", "Calf Raise", "Calf Raise"]],
      ["full-body", "Full body express", "A balanced session for busy days.", "intermediate", ["Bodyweight Squat", "Push-up", "Bent-over Row", "Plank"]],
      ["cardio", "Cardio starter", "An equipment-free moving session.", "beginner", ["March in Place", "Jumping Jack", "March in Place"]],
    ];
    for (const [slug, name, description, difficulty, exerciseNames] of plans) {
      const category = await db.getFirstAsync<{ id: number }>("SELECT id FROM workout_categories WHERE slug = ?", slug);
      if (!category) continue;
      const existing = await db.getFirstAsync<{ id: number }>("SELECT id FROM workout_plans WHERE category_id = ? AND name = ?", category.id, name);
      const planId = existing?.id ?? (await db.runAsync("INSERT INTO workout_plans (category_id,name,description,difficulty,created_at,updated_at) VALUES (?,?,?,?,?,?)", category.id, name, description, difficulty, timestamp, timestamp)).lastInsertRowId;
      for (let index = 0; index < exerciseNames.length; index += 1) {
        const exercise = await db.getFirstAsync<{ id: number }>("SELECT id FROM exercises WHERE name = ?", exerciseNames[index]);
        if (exercise) await db.runAsync("INSERT OR IGNORE INTO workout_plan_exercises (plan_id,exercise_id,exercise_order,duration_seconds,repetitions,rest_seconds) VALUES (?,?,?,?,?,?)", planId, exercise.id, index, 35, null, 20);
      }
    }
    await db.runAsync("INSERT OR REPLACE INTO app_preferences (key,value) VALUES (?,?)", "workout_schema_version", String(WORKOUT_SCHEMA_VERSION));
  });
}

export async function getWorkoutCategories(db: SQLiteDatabase) { return db.getAllAsync<WorkoutCategory>("SELECT id,slug,name,description,icon,accent FROM workout_categories ORDER BY id"); }
export async function getWorkoutPlans(db: SQLiteDatabase, categoryId: number) { return db.getAllAsync<WorkoutPlan>(`SELECT p.id,p.category_id,c.name category_name,p.name,p.description,p.difficulty,COALESCE(SUM(pe.duration_seconds + pe.rest_seconds),0) duration_seconds,COUNT(pe.id) exercise_count FROM workout_plans p JOIN workout_categories c ON c.id=p.category_id LEFT JOIN workout_plan_exercises pe ON pe.plan_id=p.id WHERE p.category_id=? GROUP BY p.id ORDER BY p.id`, categoryId); }
export async function getWorkoutPlan(db: SQLiteDatabase, planId: number) { return db.getFirstAsync<WorkoutPlan>(`SELECT p.id,p.category_id,c.name category_name,p.name,p.description,p.difficulty,COALESCE(SUM(pe.duration_seconds + pe.rest_seconds),0) duration_seconds,COUNT(pe.id) exercise_count FROM workout_plans p JOIN workout_categories c ON c.id=p.category_id LEFT JOIN workout_plan_exercises pe ON pe.plan_id=p.id WHERE p.id=? GROUP BY p.id`, planId); }
export async function getPlanExercises(db: SQLiteDatabase, planId: number) { return db.getAllAsync<WorkoutPlanExercise>(`SELECT pe.id plan_exercise_id,pe.exercise_order,pe.duration_seconds,pe.repetitions,pe.rest_seconds,e.id,e.name,e.description,e.instructions,e.equipment,e.image_uri,e.targeted_muscles FROM workout_plan_exercises pe JOIN exercises e ON e.id=pe.exercise_id WHERE pe.plan_id=? ORDER BY pe.exercise_order`, planId); }
export async function getExerciseDetails(db: SQLiteDatabase, planExerciseId: number) { return db.getFirstAsync<ExerciseDetails>(`SELECT pe.id plan_exercise_id,p.id plan_id,pe.exercise_order,pe.duration_seconds,pe.repetitions,pe.rest_seconds,e.id,e.name,e.description,e.instructions,e.equipment,e.image_uri,e.targeted_muscles,p.difficulty plan_difficulty,em.media_type,em.source_uri media_source_uri,em.asset_key media_asset_key,em.poster_uri media_poster_uri,em.source media_source,em.license media_license,em.attribution media_attribution FROM workout_plan_exercises pe JOIN exercises e ON e.id=pe.exercise_id JOIN workout_plans p ON p.id=pe.plan_id LEFT JOIN exercise_media em ON em.exercise_id=e.id WHERE pe.id=?`, planExerciseId); }
export async function createWorkoutSession(db: SQLiteDatabase, planId: number) { const timestamp = now(); let sessionId = 0; await db.withTransactionAsync(async () => { sessionId = (await db.runAsync("INSERT INTO workout_sessions (plan_id,started_at,status,created_at,updated_at) VALUES (?,?, 'active',?,?)", planId, timestamp, timestamp, timestamp)).lastInsertRowId; await db.runAsync("INSERT INTO workout_session_exercises (session_id,exercise_id,exercise_order,duration_seconds,rest_seconds,status) SELECT ?,exercise_id,exercise_order,duration_seconds,rest_seconds,'pending' FROM workout_plan_exercises WHERE plan_id=? ORDER BY exercise_order", sessionId, planId); }); return sessionId; }
export async function getActiveWorkoutSession(db: SQLiteDatabase) { return db.getFirstAsync<WorkoutSession>(`SELECT s.id,s.plan_id,p.name plan_name,c.name category_name,s.started_at,s.finished_at,s.status,s.paused_seconds,s.total_rest_seconds FROM workout_sessions s JOIN workout_plans p ON p.id=s.plan_id JOIN workout_categories c ON c.id=p.category_id WHERE s.status='active' ORDER BY s.id DESC LIMIT 1`); }
export async function getSessionExercises(db: SQLiteDatabase, sessionId: number) { return db.getAllAsync<WorkoutSessionExercise>(`SELECT se.id,se.session_id,se.exercise_id,e.name exercise_name,se.exercise_order,se.duration_seconds,se.rest_seconds,se.status,se.started_at,se.completed_at FROM workout_session_exercises se JOIN exercises e ON e.id=se.exercise_id WHERE se.session_id=? ORDER BY se.exercise_order`, sessionId); }
export async function updateSessionExercise(db: SQLiteDatabase, id: number, status: ExerciseStatus) { const timestamp = now(); await db.runAsync("UPDATE workout_session_exercises SET status=?, started_at=CASE WHEN ?='in_progress' AND started_at IS NULL THEN ? ELSE started_at END, completed_at=CASE WHEN ? IN ('completed','skipped') THEN ? ELSE completed_at END WHERE id=?", status, status, timestamp, status, timestamp, id); }
export async function finishWorkoutSession(db: SQLiteDatabase, sessionId: number, status: "completed" | "abandoned", totalRestSeconds: number) { await db.runAsync("UPDATE workout_sessions SET status=?,finished_at=?,total_rest_seconds=?,updated_at=? WHERE id=?", status, now(), totalRestSeconds, now(), sessionId); }
export async function getWorkoutHistory(db: SQLiteDatabase) { return db.getAllAsync<WorkoutSession>(`SELECT s.id,s.plan_id,p.name plan_name,c.name category_name,s.started_at,s.finished_at,s.status,s.paused_seconds,s.total_rest_seconds FROM workout_sessions s JOIN workout_plans p ON p.id=s.plan_id JOIN workout_categories c ON c.id=p.category_id WHERE s.status='completed' ORDER BY s.started_at DESC`); }
export async function getWorkoutStats(db: SQLiteDatabase): Promise<WorkoutStats> { const rows = await getWorkoutHistory(db); const nowDate = new Date(); const week = new Date(nowDate); week.setDate(week.getDate() - 7); const month = new Date(nowDate); month.setMonth(month.getMonth() - 1); const categoryCounts = new Map<string, number>(); for (const row of rows) categoryCounts.set(row.category_name, (categoryCounts.get(row.category_name) ?? 0) + 1); const favoriteCategory = [...categoryCounts.entries()].sort((a,b) => b[1]-a[1])[0]?.[0] ?? null; const days = new Set(rows.map((row) => row.started_at.slice(0,10))); return { totalSessions: rows.length, totalTrainingSeconds: rows.reduce((sum,row) => sum + Math.max(0, (row.finished_at ? Date.parse(row.finished_at) : Date.parse(row.started_at)) - Date.parse(row.started_at)) / 1000 - row.paused_seconds, 0), currentWeekSessions: rows.filter((row) => Date.parse(row.started_at) >= week.getTime()).length, currentMonthSessions: rows.filter((row) => Date.parse(row.started_at) >= month.getTime()).length, consistencyDays: days.size, favoriteCategory }; }

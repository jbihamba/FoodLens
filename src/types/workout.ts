export type WorkoutDifficulty = "beginner" | "intermediate" | "advanced";
export type ExerciseStatus = "pending" | "in_progress" | "completed" | "skipped";
export type ExerciseMediaType = "image" | "gif" | "mp4";

export interface ExerciseMedia {
  exercise_id: number;
  media_type: ExerciseMediaType;
  source_uri: string | null;
  asset_key: string | null;
  poster_uri: string | null;
  source: string | null;
  license: string | null;
  attribution: string | null;
}

export interface WorkoutCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
}

export interface Exercise {
  id: number;
  name: string;
  description: string;
  instructions: string;
  equipment: string | null;
  image_uri: string | null;
  targeted_muscles: string;
}

export interface WorkoutPlan {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  difficulty: WorkoutDifficulty;
  duration_seconds: number;
  exercise_count: number;
}

export interface WorkoutPlanExercise extends Exercise {
  plan_exercise_id: number;
  exercise_order: number;
  duration_seconds: number;
  repetitions: number | null;
  rest_seconds: number;
}

export interface ExerciseDetails extends WorkoutPlanExercise {
  plan_id: number;
  plan_difficulty: WorkoutDifficulty;
  media_type: ExerciseMediaType | null;
  media_source_uri: string | null;
  media_asset_key: string | null;
  media_poster_uri: string | null;
  media_source: string | null;
  media_license: string | null;
  media_attribution: string | null;
}

export interface WorkoutSession {
  id: number;
  plan_id: number;
  plan_name: string;
  category_name: string;
  started_at: string;
  finished_at: string | null;
  status: "active" | "completed" | "abandoned";
  paused_seconds: number;
  total_rest_seconds: number;
}

export interface WorkoutSessionExercise {
  id: number;
  session_id: number;
  exercise_id: number;
  exercise_name: string;
  exercise_order: number;
  duration_seconds: number;
  rest_seconds: number;
  status: ExerciseStatus;
  started_at: string | null;
  completed_at: string | null;
}

export interface WorkoutStats {
  totalSessions: number;
  totalTrainingSeconds: number;
  currentWeekSessions: number;
  currentMonthSessions: number;
  consistencyDays: number;
  favoriteCategory: string | null;
}

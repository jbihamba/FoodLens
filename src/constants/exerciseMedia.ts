/**
 * Register approved, bundled exercise media here with `require(...)`.
 * Keeping this registry static lets Metro bundle local assets while media
 * metadata remains in SQLite and remote URLs remain optional.
 */
export const bundledExerciseMedia: Record<string, number> = {
  "bodyweight-squat": require("../../assets/exercises/bodyweight-squat.gif"),
  "push-up": require("../../assets/exercises/push-up.gif"),
  "jumping-jack": require("../../assets/exercises/jumping-jack.gif"),
  "calf-raise": require("../../assets/exercises/calf-raise.gif"),
};

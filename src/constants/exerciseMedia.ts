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

/** One locally bundled, exercise-specific photo for browse cards and fallbacks. */
export const bundledExerciseImages: Record<string, number> = {
  "Bodyweight Squat": require("../../assets/exercises/bodyweight-squat.jpg"),
  "Push-up": require("../../assets/exercises/push-up.jpg"),
  "Bent-over Row": require("../../assets/exercises/bent-over-row.jpg"),
  "Reverse Lunge": require("../../assets/exercises/reverse-lunge.jpg"),
  Plank: require("../../assets/exercises/plank.jpg"),
  "Glute Bridge": require("../../assets/exercises/glute-bridge.jpg"),
  "Calf Raise": require("../../assets/exercises/calf-raise.jpg"),
  "March in Place": require("../../assets/exercises/march-in-place.jpg"),
  "Jumping Jack": require("../../assets/exercises/jumping-jack.jpg"),
  "Shoulder Press": require("../../assets/exercises/shoulder-press.jpg"),
};

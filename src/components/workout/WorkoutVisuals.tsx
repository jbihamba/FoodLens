import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

interface VisualProps {
  size?: number;
  color?: string;
}

const bodyStroke = "#87938D";

/** Original, code-based anatomy visual. It keeps category art local and license-safe. */
export function MuscleGroupIllustration({
  slug,
  size = 48,
  color = "#D97736",
}: VisualProps & { slug: string }) {
  const lower = slug.toLowerCase();
  const target = (path: string) => (
    <Path d={path} fill={`${color}55`} stroke={color} strokeWidth="1.5" />
  );

  let highlight = target("M7 31h10l-1 13-3 12h-3L8 44Z M17 31h10l-1 13-2 12h-3l-3-12Z");
  if (lower.includes("chest")) highlight = target("M8 24c3-3 6-3 9 0v7c-3 2-6 2-9 0ZM17 24c3-3 6-3 9 0v7c-3 2-6 2-9 0Z");
  if (lower.includes("back")) highlight = target("M10 22h14l2 12-8 4-8-4Z");
  if (lower.includes("arm")) highlight = target("M8 23 4 34l3 2 7-9ZM24 23l4 11-3 2-7-9Z");
  if (lower.includes("shoulder")) highlight = target("M8 23a5 5 0 0 1 5 4l-5 4-4-3a5 5 0 0 1 4-5ZM24 23a5 5 0 0 0-5 4l5 4 4-3a5 5 0 0 0-4-5Z");
  if (lower.includes("ab")) highlight = target("M11 25h10v12H11Z");
  if (lower.includes("glute")) highlight = target("M8 30c3-4 6-4 8 0v6H8ZM16 30c2-4 5-4 8 0v6h-8Z");
  if (lower.includes("calf")) highlight = target("M9 40h7l-2 16h-5ZM17 40h7l1 16h-5Z");
  if (lower.includes("cardio") || lower.includes("full")) highlight = target("M13 22h6l5 15-5 5h-6l-5-5Z");

  return (
    <Svg width={size} height={size} viewBox="0 0 32 60" fill="none">
      <Circle cx="16" cy="8" r="5" stroke={bodyStroke} strokeWidth="1.8" />
      <Path d="M12 14h8l4 13-4 5h-8l-4-5 4-13ZM12 32l-4 13M20 32l4 13M8 21 3 34M24 21l5 13" stroke={bodyStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {highlight}
      <Line x1="5" y1="57" x2="13" y2="57" stroke={bodyStroke} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="19" y1="57" x2="27" y2="57" stroke={bodyStroke} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Original exercise pose line art used when no exercise-specific media exists. */
export function ExercisePoseIllustration({
  exerciseName,
  size = 58,
  color = "#D97736",
}: VisualProps & { exerciseName: string }) {
  const name = exerciseName.toLowerCase();
  const isFloor = name.includes("push") || name.includes("plank");
  const isJump = name.includes("jump") || name.includes("jack");
  const isPress = name.includes("press") || name.includes("row");
  const isLunge = name.includes("lunge") || name.includes("squat") || name.includes("calf");

  if (isFloor) {
    return (
      <Svg width={size} height={size} viewBox="0 0 72 52" fill="none">
        <Circle cx="52" cy="14" r="5" stroke={color} strokeWidth="2.5" />
        <Path d="M47 19 35 28 18 30M35 28l10 13M27 29l-8 13M18 30H8M45 41h10M19 42h-8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M8 46h55" stroke="#A8B1AC" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    );
  }

  if (isJump) {
    return (
      <Svg width={size} height={size} viewBox="0 0 72 64" fill="none">
        <Circle cx="36" cy="12" r="5" stroke={color} strokeWidth="2.5" />
        <Path d="M36 17v20M36 23 17 12M36 23l19-11M36 37 19 56M36 37l17 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M9 17 3 12M63 17l6-5M11 53l-7 4M61 53l7 4" stroke="#A8B1AC" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    );
  }

  if (isPress || isLunge) {
    return (
      <Svg width={size} height={size} viewBox="0 0 72 64" fill="none">
        <Circle cx="36" cy="10" r="5" stroke={color} strokeWidth="2.5" />
        <Path d="M36 15v21M36 22l-15-9M36 22l15-9M36 36 24 55M36 36l17 12M18 56h14M51 48l11 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {isPress ? <Rect x="13" y="9" width="46" height="2" rx="1" fill="#A8B1AC" /> : null}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 72 64" fill="none">
      <Circle cx="36" cy="10" r="5" stroke={color} strokeWidth="2.5" />
      <Path d="M36 15v22M36 22l-14 9M36 22l14 9M36 37 25 55M36 37l11 18M20 56h13M45 56h13" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M27 37h18" stroke="#A8B1AC" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

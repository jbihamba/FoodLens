import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { ExercisePoseIllustration } from "@/components/workout/WorkoutVisuals";
import { bundledExerciseImages } from "@/constants/exerciseMedia";

export function ExerciseThumbnail({
  exerciseName,
  size = 58,
  color = "#D97736",
}: {
  exerciseName: string;
  size?: number;
  color?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = bundledExerciseImages[exerciseName];

  if (!source || failed) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <ExercisePoseIllustration exerciseName={exerciseName} size={size - 8} color={color} />
      </View>
    );
  }

  return (
    <Image
      source={source}
      contentFit="cover"
      cachePolicy="disk"
      transition={150}
      style={{ width: size, height: size, borderRadius: 14 }}
      onError={() => setFailed(true)}
      accessibilityLabel={`Démonstration de ${exerciseName}`}
    />
  );
}

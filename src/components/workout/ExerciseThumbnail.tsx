import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { bundledExerciseImages } from "@/constants/exerciseMedia";

export function ExerciseThumbnail({
  exerciseName,
  size = 58,
}: {
  exerciseName: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const source = bundledExerciseImages[exerciseName];

  if (!source || failed) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center rounded-[14px] bg-fitness-softLight dark:bg-fitness-softDark" />
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

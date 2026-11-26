import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { bundledCategoryImages } from "@/constants/exerciseMedia";

export function WorkoutCategoryPhoto({
  slug,
  size = 56,
}: {
  slug: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const source = bundledCategoryImages[slug];

  if (!source || failed) {
    return <View style={{ width: size, height: size }} className="rounded-[16px] bg-fitness-softLight dark:bg-fitness-softDark" />;
  }

  return (
    <Image
      source={source}
      contentFit="cover"
      cachePolicy="disk"
      transition={150}
      style={{ width: size, height: size, borderRadius: 16 }}
      onError={() => setFailed(true)}
      accessibilityLabel="Photo d'une personne réalisant un exercice"
    />
  );
}

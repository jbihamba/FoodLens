import { useEvent } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable as NativePressable,
  View,
} from "react-native";

import { Text } from "@/components/LocalizedText";
import { FitnessIcon } from "@/components/ui/Icons";
import { bundledExerciseMedia } from "@/constants/exerciseMedia";
import type { ExerciseMediaType } from "@/types/workout";

export interface ExerciseMediaInput {
  media_type?: ExerciseMediaType | null;
  media_source_uri?: string | null;
  media_asset_key?: string | null;
  image_uri?: string | null;
}

function FallbackIllustration({ height = 224 }: { height?: number }) {
  return (
    <View
      style={{ height }}
      className="items-center justify-center rounded-[24px] border border-[#F5D6BE] bg-fitness-softLight px-6 dark:border-[#523824] dark:bg-fitness-softDark"
    >
      <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark">
        <FitnessIcon size={30} color="#D97736" />
      </View>
      <Text className="mt-3 text-center text-[13px] font-bold text-fitness-primary dark:text-fitness-dark">
        Suis les instructions ci-dessous
      </Text>
      <Text className="mt-1 text-center text-[11px] text-muted-light dark:text-muted-dark">
        Démonstration animée bientôt disponible
      </Text>
    </View>
  );
}

function VideoDemo({
  source,
  height = 224,
}: {
  source: string | number;
  height?: number;
}) {
  const videoSource =
    typeof source === "number" ? source : { uri: source, useCaching: true };
  const player = useVideoPlayer(videoSource, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });
  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
  });
  const [paused, setPaused] = useState(false);

  if (status === "error" || error) {
    return <FallbackIllustration height={height} />;
  }

  return (
    <View className="overflow-hidden rounded-[24px] bg-black">
      <VideoView
        player={player}
        style={{ width: "100%", height }}
        contentFit="cover"
        nativeControls={false}
      />
      <NativePressable
        accessibilityLabel={
          paused ? "Reprendre la démonstration" : "Mettre en pause la démonstration"
        }
        onPress={() => {
          if (paused) player.play();
          else player.pause();
          setPaused(!paused);
        }}
        className="absolute bottom-3 right-3 min-h-11 min-w-11 items-center justify-center rounded-full bg-black/65"
      >
        <Text className="text-base text-white">{paused ? "▶" : "❚❚"}</Text>
      </NativePressable>
      {status === "loading" ? (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

function ImageDemo({
  source,
  height = 224,
}: {
  source: string | number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <FallbackIllustration height={height} />;

  return (
    <View className="overflow-hidden rounded-[24px] border border-brand-border bg-surface-light dark:border-selected-dark dark:bg-surface-dark">
      <Image
        source={source}
        contentFit="cover"
        style={{ width: "100%", height }}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

export function ExerciseMediaDemo({
  exercise,
  height = 224,
}: {
  exercise: ExerciseMediaInput;
  height?: number;
}) {
  const bundledSource = exercise.media_asset_key
    ? bundledExerciseMedia[exercise.media_asset_key]
    : undefined;
  const source = exercise.media_source_uri ?? bundledSource;

  if (exercise.media_type === "mp4" && source !== undefined) {
    return <VideoDemo source={source} height={height} />;
  }
  if (
    (exercise.media_type === "image" || exercise.media_type === "gif") &&
    source !== undefined
  ) {
    return <ImageDemo source={source} height={height} />;
  }
  if (exercise.image_uri) {
    return <ImageDemo source={exercise.image_uri} height={height} />;
  }
  return <FallbackIllustration height={height} />;
}

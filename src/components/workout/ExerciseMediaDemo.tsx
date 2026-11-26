import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable as NativePressable, View } from "react-native";

import type { ExerciseDetails } from "@/types/workout";
import { Text } from "@/components/LocalizedText";
import { bundledExerciseMedia } from "@/constants/exerciseMedia";

function FallbackIllustration() {
  return <View className="h-56 items-center justify-center rounded-[24px] bg-brand-secondary"><View className="h-14 w-14 rounded-full border-4 border-brand-primary" /><View className="mt-2 h-20 w-1.5 rounded-full bg-brand-primary" /><View className="absolute mt-16 h-1.5 w-28 rounded-full bg-brand-primary" /><View className="absolute mt-36 h-1.5 w-24 rotate-[-18deg] rounded-full bg-brand-primary" /><View className="absolute mt-36 h-1.5 w-24 rotate-[18deg] rounded-full bg-brand-primary" /><Text className="absolute bottom-4 text-[12px] font-bold text-brand-primary">Démonstration bientôt disponible</Text></View>;
}

function VideoDemo({ source }: { source: string | number }) {
  const videoSource = typeof source === "number" ? source : { uri: source, useCaching: true };
  const player = useVideoPlayer(videoSource, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });
  const { status, error } = useEvent(player, "statusChange", { status: player.status });
  const [paused, setPaused] = useState(false);
  if (status === "error" || error) return <FallbackIllustration />;
  return <View className="overflow-hidden rounded-[24px] bg-black"><VideoView player={player} style={{ width: "100%", height: 224 }} contentFit="cover" nativeControls={false} /><NativePressable accessibilityLabel={paused ? "Reprendre la démonstration" : "Mettre en pause la démonstration"} onPress={() => { if (paused) player.play(); else player.pause(); setPaused(!paused); }} className="absolute bottom-3 right-3 min-h-11 min-w-11 items-center justify-center rounded-full bg-black/65"><Text className="text-lg text-white">{paused ? "▶" : "Ⅱ"}</Text></NativePressable>{status === "loading" ? <View className="absolute inset-0 items-center justify-center"><ActivityIndicator color="#FFFFFF" /></View> : null}</View>;
}

function ImageDemo({ source }: { source: string | number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <FallbackIllustration />;
  return <View className="overflow-hidden rounded-[24px] bg-surface-light dark:bg-surface-dark"><Image source={source} contentFit="cover" style={{ width: "100%", height: 224 }} onError={() => setFailed(true)} /></View>;
}

export function ExerciseMediaDemo({ exercise }: { exercise: ExerciseDetails }) {
  const bundledSource = exercise.media_asset_key ? bundledExerciseMedia[exercise.media_asset_key] : undefined;
  const source = exercise.media_source_uri ?? bundledSource;
  if (exercise.media_type === "mp4" && source !== undefined) return <VideoDemo source={source} />;
  if ((exercise.media_type === "image" || exercise.media_type === "gif") && source !== undefined) return <ImageDemo source={source} />;
  if (exercise.image_uri) return <ImageDemo source={exercise.image_uri} />;
  return <FallbackIllustration />;
}

import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, View } from "react-native";

import { Text, Pressable } from "@/components/LocalizedText";
import { StyledImage } from "@/components/nativewind-interop";
import { NutritionBlock } from "@/components/scan/NutritionBlock";
import { ScanSkeleton } from "@/components/scan/ScanSkeleton";
import type { ScanState } from "@/hooks/scanReducer";

const errorCopy = {
  timeout: ["L’analyse prend plus de temps que prévu.", "Réessaie ou ajoute le repas manuellement."],
  network: ["Connexion impossible.", "Vérifie ta connexion puis réessaie."],
  unrecognizedFood: ["Le plat n’a pas été reconnu.", "Essaie une photo plus claire ou saisis le nom."],
  nutritionNotFound: ["Les nutriments sont introuvables.", "Garde le nom ou saisis les calories manuellement."],
  cancelled: ["Analyse annulée.", "Tu peux reprendre quand tu veux."],
  unknown: ["L’analyse a échoué.", "Réessaie dans un instant."],
} as const;

export function ScanResultSheet({ state, onRetry, onCancel }: { state: ScanState; onRetry: () => void; onCancel: () => void }) {
  const announced = useRef("");
  const announcement = state.status === "error"
    ? errorCopy[state.failure ?? "unknown"][0]
    : state.status === "identifying"
      ? "Analyse en cours…"
      : state.status === "lookingUpNutrition"
        ? `Plat identifié : ${state.analysis?.foodName ?? ""}`
        : state.status === "done"
          ? `Calories disponibles : ${state.analysis?.estimatedCalories ?? ""}`
          : "Photo prête";
  useEffect(() => {
    if (announcement && announced.current !== announcement) {
      announced.current = announcement;
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [announcement]);

  const close = () => { onCancel(); if (router.canGoBack()) router.back(); else router.replace("/"); };
  const failed = state.status === "error";
  return (
    <View className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-xl font-bold text-ink-light dark:text-ink-dark">Résultat du scan</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Annuler l’analyse" onPress={close} className="min-h-11 min-w-11 items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark"><Text className="text-2xl text-ink-light dark:text-ink-dark">×</Text></Pressable>
      </View>
      <View className="flex-1 px-5">
        <View className="h-[230px] overflow-hidden rounded-[24px] bg-[#18251E]">
          {state.imageUri ? <StyledImage source={{ uri: state.imageUri }} contentFit="cover" className="h-full w-full" /> : null}
        </View>
        <View accessibilityLiveRegion="polite" className="mt-5">
          {failed ? <>
            <Text accessibilityRole="alert" className="text-xl font-bold text-ink-light dark:text-ink-dark">{errorCopy[state.failure ?? "unknown"][0]}</Text>
            <Text className="mt-2 text-sm leading-5 text-muted-light dark:text-muted-dark">{errorCopy[state.failure ?? "unknown"][1]}</Text>
            <View className="mt-5 flex-row gap-3"><Pressable accessibilityRole="button" accessibilityLabel="Réessayer l’analyse" onPress={onRetry} className="min-h-12 flex-1 items-center justify-center rounded-[16px] bg-brand-primary"><Text className="font-bold text-white">Réessayer</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Ajouter manuellement" onPress={() => router.push("/entry")} className="min-h-12 flex-1 items-center justify-center rounded-[16px] border border-brand-border"><Text className="font-bold text-ink-light dark:text-ink-dark">Manuellement</Text></Pressable></View>
          </> : <>
            {state.status === "identifying" ? <><ScanSkeleton className="h-9 w-4/5" /><Text className="mt-3 text-sm text-muted-light dark:text-muted-dark">Analyse en cours…</Text></> : <Text className="h-9 text-[26px] font-bold text-ink-light dark:text-ink-dark">{state.analysis?.foodName}</Text>}
            <NutritionBlock analysis={state.status === "identifying" ? null : state.analysis} />
          </>}
        </View>
      </View>
      {!failed ? <View className="border-t border-selected-light px-5 py-3 dark:border-selected-dark"><Pressable accessibilityRole="button" accessibilityLabel="Annuler l’analyse" onPress={close} className="min-h-12 items-center justify-center rounded-[16px] border border-brand-border"><Text className="font-bold text-ink-light dark:text-ink-dark">Annuler</Text></Pressable></View> : null}
    </View>
  );
}

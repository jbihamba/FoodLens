import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, Text } from "@/components/LocalizedText";
import { ScanFab } from "@/components/food/ScanButton";
import { hasCompletedOnboarding } from "@/services/calorieTracking";

type GateState = "checking" | "onboarding" | "complete" | "error";

export function OnboardingGate() {
  const db = useSQLiteContext();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<GateState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (state === "complete") {
      return;
    }

    let isCurrent = true;

    const checkOnboarding = async () => {
      try {
        const completed = await hasCompletedOnboarding(db);
        if (!isCurrent) {
          return;
        }

        if (completed) {
          setState("complete");
        } else {
          setState("onboarding");
          if (pathname !== "/onboarding") {
            router.replace("/onboarding");
          }
        }
      } catch (cause) {
        if (isCurrent) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load onboarding status.",
          );
          setState("error");
        }
      }
    };

    void checkOnboarding();

    return () => {
      isCurrent = false;
    };
  }, [db, pathname, retry, state]);

  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scanner"
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="result"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.92],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="workouts" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="workout-plan" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="exercise-details" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="active-workout" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="workout-summary" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="workout-history" options={{ animation: "slide_from_right" }} />
      </Stack>
      {state === "complete" &&
      ![
        "/",
        "/journal",
        "/stats",
        "/profile",
        "/scanner",
        "/result",
        "/onboarding",
        "/workouts",
        "/workout-plan",
        "/exercise-details",
        "/active-workout",
        "/workout-summary",
        "/workout-history",
      ].includes(pathname) ? (
        <View pointerEvents="box-none" className="absolute inset-0">
          <View
            pointerEvents="box-none"
            className="absolute right-5"
            style={{ bottom: Math.max(insets.bottom, 16) + 12 }}
          >
            <ScanFab onPress={() => router.push("/scanner")} />
          </View>
        </View>
      ) : null}
      {state === "checking" ||
      (state === "onboarding" && pathname !== "/onboarding") ? (
        <View className="absolute inset-0 items-center justify-center bg-canvas-light dark:bg-canvas-dark">
          <ActivityIndicator color="#245C45" />
        </View>
      ) : null}
      {state === "error" ? (
        <View className="absolute inset-0 items-center justify-center bg-canvas-light px-8 dark:bg-canvas-dark">
          <Text className="text-center text-lg font-bold text-ink-light dark:text-ink-dark">
            FoodLens couldn&apos;t load your app
          </Text>
          <Text
            accessibilityRole="alert"
            className="mt-2 text-center text-sm leading-5 text-muted-light dark:text-muted-dark"
          >
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-5 rounded-2xl bg-brand-primary px-6 py-3"
            onPress={() => {
              setError(null);
              setState("checking");
              setRetry((value) => value + 1);
            }}
          >
            <Text className="font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

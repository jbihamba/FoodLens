import { CameraView, useCameraPermissions, type FlashMode } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { BrandMark } from "@/components/food/BrandMark";
import { FoodButton } from "@/components/food/FoodButton";
import { Pressable, Text } from "@/components/LocalizedText";
import { StyledImage } from "@/components/nativewind-interop";
import {
  FoodRecognitionError,
  analyzeFoodImage,
} from "@/services/foodRecognition";
import {
  ImageSelectionError,
  prepareFoodImage,
  selectFoodImage,
  type SelectedFoodImage,
} from "@/services/imagePicker";
import { useScanSession } from "@/stores/scan-session";

const FLASH_MODES: FlashMode[] = ["off", "auto", "on"];
const FLASH_LABELS: Record<FlashMode, string> = {
  off: "Off",
  auto: "Auto",
  on: "On",
  screen: "Screen",
};

export default function ScannerScreen() {
  const params = useLocalSearchParams<{ source?: string }>();
  const { saveScan } = useScanSession();
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<SelectedFoodImage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(
    null,
  );
  const [cameraReady, setCameraReady] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const cameraRef = useRef<CameraView>(null);
  const autoOpenedGallery = useRef(false);
  const captureHapticPending = useRef(false);
  const scanProgress = useSharedValue(0);

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanProgress.value, [0, 0.1, 0.9, 1], [0.55, 1, 1, 0.55]),
    transform: [{ translateY: interpolate(scanProgress.value, [0, 1], [0, 170]) }],
  }));

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    let isMounted = true;
    void CameraView.isAvailableAsync()
      .then((available) => {
        if (isMounted) {
          setCameraAvailable(available);
        }
      })
      .catch((error: unknown) => {
        console.error("[scanner] Could not check camera availability:", error);
        if (isMounted) {
          setCameraAvailable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isPreparingImage || !captureHapticPending.current) {
      return;
    }

    captureHapticPending.current = false;
    const haptic =
      Platform.OS === "android"
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void haptic.catch(
      (error: unknown) => {
        console.warn("[scanner] Shutter haptic was unavailable:", error);
      },
    );
  }, [isPreparingImage]);

  useEffect(() => {
    if (
      !cameraReady ||
      image ||
      isCapturing ||
      isPickingImage ||
      isPreparingImage
    ) {
      scanProgress.set(0);
      return;
    }

    scanProgress.set(withRepeat(
      withTiming(1, {
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    ));
  }, [
    cameraReady,
    image,
    isCapturing,
    isPickingImage,
    isPreparingImage,
    scanProgress,
  ]);

  const chooseImage = useCallback(async () => {
    setMessage(null);
    setCameraReady(false);
    setIsPickingImage(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      const selectedImage = await selectFoodImage();
      if (selectedImage) {
        setImage(selectedImage);
      }
    } catch (error) {
      setMessage(
        error instanceof ImageSelectionError
          ? error.message
          : "We could not open that image. Please try again.",
      );
    } finally {
      setIsPickingImage(false);
    }
  }, []);

  useEffect(() => {
    if (params.source === "gallery" && !autoOpenedGallery.current) {
      autoOpenedGallery.current = true;
      void chooseImage();
    }
  }, [chooseImage, params.source]);

  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady || isCapturing) {
      return;
    }

    setMessage(null);
    setIsCapturing(true);
    captureHapticPending.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });
      setCameraReady(false);
      setIsPreparingImage(true);
      const selectedImage = await prepareFoodImage(
        photo.uri,
        photo.width,
        photo.height,
        "image/jpeg",
      );
      setImage(selectedImage);
    } catch (error) {
      captureHapticPending.current = false;
      setMessage(
        error instanceof ImageSelectionError
          ? error.message
          : "We could not take that photo. Please try again.",
      );
    } finally {
      setIsCapturing(false);
      setIsPreparingImage(false);
    }
  };

  const enableCamera = async () => {
    setMessage(null);
    try {
      const result = await requestPermission();
      if (!result.granted) {
        setMessage("Camera access is needed to take a food photo.");
      }
    } catch {
      setMessage("We could not request camera access. Please try again.");
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setMessage("Open your device settings to allow camera access.");
    }
  };

  const retakePhoto = () => {
    setImage(null);
    setCameraReady(false);
    setCameraError(false);
    setMessage(null);
  };

  const retryCamera = async () => {
    setCameraError(false);
    setCameraReady(false);
    if (typeof document === "undefined") {
      return;
    }

    setCameraAvailable(null);
    try {
      setCameraAvailable(await CameraView.isAvailableAsync());
    } catch (error) {
      console.error("[scanner] Could not retry camera availability:", error);
      setCameraAvailable(false);
    }
  };

  const toggleFlash = () => {
    setFlashMode((currentMode) => {
      const currentIndex = FLASH_MODES.indexOf(currentMode);
      return FLASH_MODES[(currentIndex + 1) % FLASH_MODES.length];
    });
  };

  const analyze = async () => {
    if (!image) {
      setMessage("Take a photo or choose one from your gallery first.");
      return;
    }

    setMessage(null);
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeFoodImage(image.base64);
      saveScan({ imageUri: image.uri, analysis });
      router.replace("/result");
    } catch (error) {
      setMessage(
        error instanceof FoodRecognitionError
          ? error.message
          : "Something went wrong while analyzing your meal. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasPermission = permission?.granted === true;
  const isWebCameraLoading =
    typeof document !== "undefined" && cameraAvailable === null;
  const isCameraLoading =
    !image &&
    !isPreparingImage &&
    (isPickingImage ||
      (!cameraError &&
        (permission === null ||
          isWebCameraLoading ||
          (hasPermission && cameraAvailable !== false && !cameraReady))));
  const isCameraUnavailable =
    !image &&
    !isPickingImage &&
    !isPreparingImage &&
    hasPermission &&
    (cameraError || cameraAvailable === false);

  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <ScrollView
        contentContainerClassName="mx-auto w-full max-w-[560px] self-center px-6 pb-9"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="min-h-[58px] flex-row items-center justify-between">
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to home"
              className="h-10 w-10 items-center justify-center"
            >
              <Text className="-mt-1 text-[37px] leading-10 text-ink-light dark:text-ink-dark">
                ‹
              </Text>
            </Pressable>
          </Link>
          <View className="flex-row items-center gap-2">
            <BrandMark size={34} />
            <Text className="text-base font-bold text-ink-light dark:text-ink-dark">
              FoodLens
            </Text>
          </View>
          <View className="w-10" />
        </View>

        <View className="py-[21px]">
          <Text className="text-[10px] font-bold tracking-[1.3px] text-brand-primary">
            MEAL SCANNER
          </Text>
          <Text className="mt-[10px] text-[34px] font-bold leading-[38px] tracking-[-1px] text-ink-light dark:text-ink-dark">
            Let&apos;s take a{"\n"}closer look.
          </Text>
          <Text className="mt-[9px] text-sm leading-[21px] text-muted-light dark:text-muted-dark">
            A clear photo helps us make a better estimate.
          </Text>
        </View>

        <View className="h-[310px] overflow-hidden rounded-[25px] border-[0.5px] border-selected-light bg-[#18251E] dark:border-selected-dark">
          {image ? (
            <Animated.View
              entering={FadeIn.duration(220)}
              exiting={FadeOut.duration(180)}
              style={StyleSheet.absoluteFill}
            >
              <StyledImage
                source={{ uri: image.uri }}
                contentFit="cover"
                className="h-full w-full"
              />
              <View className="absolute bottom-3 left-3 right-3 rounded-[14px] bg-[#202820CC] px-4 py-[11px]">
                <Text className="text-sm font-bold text-white">Photo ready</Text>
                <Text className="mt-1 text-xs leading-[17px] text-[#E6EDE6]">
                  Your meal is in focus. Continue when you&apos;re ready.
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {!image && !isPickingImage && !isPreparingImage && hasPermission && !cameraError && cameraAvailable !== false ? (
            <CameraView
              ref={cameraRef}
              accessibilityLabel="Live food camera preview"
              style={StyleSheet.absoluteFill}
              facing="back"
              mode="picture"
              flash={flashMode}
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => {
                setCameraReady(false);
                setCameraError(true);
              }}
            />
          ) : null}

          {!image && !isPickingImage && !isPreparingImage && cameraReady && hasPermission ? (
            <Animated.View
              entering={FadeIn.duration(220)}
              exiting={FadeOut.duration(180)}
              pointerEvents="none"
              className="absolute inset-0 items-center"
            >
              <View className="absolute inset-0 bg-black/10" />
              <View className="absolute left-4 right-4 top-4 items-center rounded-full bg-[#202820CC] px-4 py-[10px]">
                <Text className="text-[13px] font-semibold text-white">
                  Position your food inside the frame
                </Text>
              </View>
              <View className="absolute top-[72px] h-[190px] w-[82%] rounded-[26px] border border-white/65">
                <View className="absolute -left-px -top-px h-6 w-6 rounded-tl-[26px] border-l-[3px] border-t-[3px] border-[#D5F0D8]" />
                <View className="absolute -right-px -top-px h-6 w-6 rounded-tr-[26px] border-r-[3px] border-t-[3px] border-[#D5F0D8]" />
                <View className="absolute -bottom-px -left-px h-6 w-6 rounded-bl-[26px] border-b-[3px] border-l-[3px] border-[#D5F0D8]" />
                <View className="absolute -bottom-px -right-px h-6 w-6 rounded-br-[26px] border-b-[3px] border-r-[3px] border-[#D5F0D8]" />
                <Animated.View
                  style={scanLineStyle}
                  className="absolute left-3 right-3 top-2 h-[2px] rounded-full bg-[#D5F0D8]"
                />
              </View>
            </Animated.View>
          ) : null}

          {!image && !isPickingImage && !isPreparingImage && permission && !hasPermission ? (
            <Animated.View
              entering={FadeIn.duration(220)}
              className="absolute inset-0 items-center justify-center px-7"
            >
              <Text className="text-center text-lg font-bold text-white">
                Camera access needed
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#E6EDE6]">
                Allow camera access to frame and capture your meal.
              </Text>
              {permission.canAskAgain ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void enableCamera()}
                  className="mt-4 min-h-11 items-center justify-center rounded-full bg-white px-5"
                >
                  <Text className="text-sm font-bold text-brand-primary">
                    Enable camera
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void openSettings()}
                  className="mt-4 min-h-11 items-center justify-center rounded-full bg-white px-5"
                >
                  <Text className="text-sm font-bold text-brand-primary">
                    Open settings
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          ) : null}

          {!image && !isPickingImage && !isPreparingImage && isCameraUnavailable ? (
            <Animated.View
              entering={FadeIn.duration(220)}
              className="absolute inset-0 items-center justify-center px-7"
            >
              <Text className="text-center text-lg font-bold text-white">
                Camera unavailable
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#E6EDE6]">
                You can still choose a photo from your gallery.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void retryCamera()}
                className="mt-4 min-h-11 items-center justify-center rounded-full bg-white px-5"
              >
                <Text className="text-sm font-bold text-brand-primary">
                  Try camera again
                </Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {!image && isCameraLoading ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              className="absolute inset-0 items-center justify-center bg-[#18251E]"
            >
              <ActivityIndicator size="large" color="#D5F0D8" />
              <Text className="mt-3 text-sm text-white">
                {isPickingImage ? "Opening your gallery…" : "Starting camera…"}
              </Text>
            </Animated.View>
          ) : null}

          {!image && isCapturing ? (
            <View className="absolute inset-0 items-center justify-center bg-[#18251E66]">
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text className="mt-3 text-sm font-semibold text-white">
                Preparing your photo…
              </Text>
            </View>
          ) : null}

          {!image && !isPreparingImage && cameraReady && hasPermission ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Flash ${FLASH_LABELS[flashMode]}. Tap to change flash mode.`}
              accessibilityState={{ selected: flashMode !== "off" }}
              onPress={toggleFlash}
              className="absolute right-3 top-3 min-h-10 flex-row items-center justify-center rounded-full bg-[#202820CC] px-3"
            >
              <Text className="text-xs font-bold text-white">
                Flash: {FLASH_LABELS[flashMode]}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {image ? (
          <View className="mt-4 gap-[10px]">
            <FoodButton
              label="Retake photo"
              variant="secondary"
              trailing="↻"
              disabled={isAnalyzing}
              onPress={retakePhoto}
            />
            <FoodButton
              label="Change photo"
              variant="outline"
              trailing="＋"
              disabled={isAnalyzing}
              onPress={() => void chooseImage()}
            />
          </View>
        ) : hasPermission && !isCameraUnavailable ? (
          <View className="mt-4 min-h-[72px] flex-row items-center justify-between px-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose a photo from your gallery"
              disabled={isCapturing || isPickingImage}
              onPress={() => void chooseImage()}
              className="h-12 min-w-[78px] items-center justify-center rounded-full border border-brand-border px-3 disabled:opacity-50"
            >
              <Text className="text-xs font-bold text-brand-primary">Gallery</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              disabled={!cameraReady || isCapturing || isPickingImage}
              onPress={() => void takePhoto()}
              className="h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-brand-primary disabled:opacity-50"
            >
              <View className="h-[52px] w-[52px] rounded-full bg-brand-primary" />
            </Pressable>
            <View className="w-[78px] items-center">
              <Text className="text-[10px] text-muted-light dark:text-muted-dark">
                {FLASH_LABELS[flashMode]}
              </Text>
              <Text className="mt-1 text-[10px] font-semibold text-muted-light dark:text-muted-dark">
                flash
              </Text>
            </View>
          </View>
        ) : !hasPermission ? (
          <FoodButton
            label="Choose from gallery"
            variant="outline"
            trailing="＋"
            onPress={() => void chooseImage()}
            className="mt-4"
          />
        ) : isCameraUnavailable ? (
          <FoodButton
            label="Choose from gallery"
            variant="outline"
            trailing="＋"
            onPress={() => void chooseImage()}
            className="mt-4"
          />
        ) : null}

        {message ? (
          <View
            accessibilityRole="alert"
            className="mt-[15px] rounded-[14px] bg-selected-light p-[14px] dark:bg-selected-dark"
          >
            <Text className="text-[13px] leading-[19px] text-ink-light dark:text-ink-dark">
              {message}
            </Text>
          </View>
        ) : null}

        <FoodButton
          label={isAnalyzing ? "Taking a closer look…" : "Analyze my meal"}
          hint={
            isAnalyzing
              ? undefined
              : "Your photo is only used for this estimate"
          }
          trailing={isAnalyzing ? undefined : "→"}
          disabled={!image || isAnalyzing}
          onPress={() => void analyze()}
          className="mt-[19px]"
        />
        {isAnalyzing ? (
          <View className="mt-[15px] min-h-[46px] flex-row items-center justify-center gap-[9px]">
            <ActivityIndicator color="#245C45" />
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              Identifying foods and estimating a portion…
            </Text>
          </View>
        ) : (
          <Text className="mt-[14px] text-center text-[11px] leading-[17px] text-muted-light dark:text-muted-dark">
            Estimates can vary with ingredients, portions, and preparation.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type FlashMode,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Pressable, Text } from "@/components/LocalizedText";
import { StyledImage } from "@/components/nativewind-interop";
import { theme } from "@/constants/theme";
import {
  ImageSelectionError,
  prepareFoodImage,
  selectFoodImage,
  type SelectedFoodImage,
} from "@/services/imagePicker";
import { useScanSession } from "@/stores/scan-session";

type ScanMode = "photo" | "barcode";
const FLASH_MODES: FlashMode[] = ["off", "auto", "on"];

export default function ScannerScreen() {
  const params = useLocalSearchParams<{ source?: string; mode?: string }>();
  const { saveScan } = useScanSession();
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<SelectedFoodImage | null>(null);
  const [mode, setMode] = useState<ScanMode>(
    params.mode === "barcode" ? "barcode" : "photo",
  );
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [barcode, setBarcode] = useState<BarcodeScanningResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const autoOpenedGallery = useRef(false);
  const captureHapticPending = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let active = true;
    void CameraView.isAvailableAsync()
      .then((available) => {
        if (active) setCameraAvailable(available);
      })
      .catch((cause: unknown) => {
        console.error("[scanner] Could not check camera availability:", cause);
        if (active) setCameraAvailable(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isPreparingImage || !captureHapticPending.current) return;

    captureHapticPending.current = false;
    const feedback =
      Platform.OS === "android"
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void feedback.catch((cause: unknown) => {
      console.warn("[scanner] Shutter haptic was unavailable:", cause);
    });
  }, [isPreparingImage]);

  const chooseImage = useCallback(async () => {
    setMessage(null);
    setCameraReady(false);
    setIsPickingImage(true);
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const selectedImage = await selectFoodImage();
      if (selectedImage) setImage(selectedImage);
    } catch (cause) {
      setMessage(
        cause instanceof ImageSelectionError
          ? cause.message
          : "Impossible d’ouvrir cette image. Réessaie.",
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
    if (!cameraRef.current || !cameraReady || isCapturing) return;
    setMessage(null);
    setIsCapturing(true);
    captureHapticPending.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      setCameraReady(false);
      setIsPreparingImage(true);
      const selectedImage = await prepareFoodImage(
        photo.uri,
        photo.width,
        photo.height,
        "image/jpeg",
      );
      setImage(selectedImage);
    } catch (cause) {
      captureHapticPending.current = false;
      setMessage(
        cause instanceof ImageSelectionError
          ? cause.message
          : "Impossible de prendre la photo. Réessaie.",
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
      if (!result.granted)
        setMessage("L’accès à la caméra est nécessaire pour scanner un plat.");
    } catch {
      setMessage("Impossible de demander l’accès à la caméra. Réessaie.");
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setMessage(
        "Ouvre les réglages de ton appareil pour autoriser la caméra.",
      );
    }
  };

  const retryCamera = async () => {
    setCameraError(false);
    setCameraReady(false);
    if (typeof document === "undefined") return;
    setCameraAvailable(null);
    try {
      setCameraAvailable(await CameraView.isAvailableAsync());
    } catch (cause) {
      console.error("[scanner] Could not retry camera availability:", cause);
      setCameraAvailable(false);
    }
  };

  const analyze = () => {
    if (!image) {
      setMessage("Prends une photo ou choisis une image dans ta galerie.");
      return;
    }
    setMessage(null);
    saveScan({ imageUri: image.uri, imageBase64: image.base64, analysis: null });
    router.replace("/result");
  };

  const closeScanner = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const hasPermission = permission?.granted === true;
  const isWebCameraLoading =
    typeof document !== "undefined" && cameraAvailable === null;
  const cameraLoading =
    hasPermission &&
    !image &&
    !isPickingImage &&
    !isPreparingImage &&
    (isWebCameraLoading || (cameraAvailable !== false && !cameraReady));
  const cameraUnavailable =
    hasPermission && (cameraError || cameraAvailable === false);

  return (
    <View className="flex-1 bg-[#111713]">
      {hasPermission &&
      !image &&
      !cameraUnavailable &&
      cameraAvailable !== false ? (
        <CameraView
          key={mode}
          ref={cameraRef}
          accessibilityLabel={
            mode === "barcode"
              ? "Lecteur de code-barres"
              : "Aperçu de la caméra"
          }
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          flash={flashMode}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
          }}
          onBarcodeScanned={
            mode === "barcode" && !barcode
              ? (result) => setBarcode(result)
              : undefined
          }
          onCameraReady={() => setCameraReady(true)}
          onMountError={() => {
            setCameraReady(false);
            setCameraError(true);
          }}
        />
      ) : null}

      {image ? (
        <StyledImage
          source={{ uri: image.uri }}
          contentFit="cover"
          className="absolute inset-0 h-full w-full"
        />
      ) : null}

      <SafeAreaView
        edges={["top", "bottom"]}
        className="flex-1 justify-between px-5"
      >
        <View className="flex-row items-center justify-between pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer le scanner"
            onPress={closeScanner}
            className="h-12 w-12 items-center justify-center rounded-full bg-black/50"
          >
            <Text className="text-[25px] leading-7 text-white">×</Text>
          </Pressable>
          <View className="rounded-full bg-black/45 px-4 py-2">
            <Text className="text-[14px] font-bold text-white">
              Scanner un plat
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Flash ${flashMode}`}
            accessibilityState={{ selected: flashMode !== "off" }}
            disabled={!hasPermission || mode !== "photo" || Boolean(image)}
            onPress={() =>
              setFlashMode(
                (current) =>
                  FLASH_MODES[
                    (FLASH_MODES.indexOf(current) + 1) % FLASH_MODES.length
                  ],
              )
            }
            className="h-12 min-w-12 items-center justify-center rounded-full bg-black/50 px-3 disabled:opacity-40"
          >
            <Text className="text-[12px] font-bold text-white">
              {flashMode === "off"
                ? "Flash"
                : flashMode === "auto"
                  ? "Auto"
                  : "Flash ✓"}
            </Text>
          </Pressable>
        </View>

        {!hasPermission && permission ? (
          <View className="flex-1 items-center justify-center px-4">
            <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-white/10">
              <Text className="text-[30px] text-white">⌕</Text>
            </View>
            <Text className="mt-5 text-center text-[23px] font-extrabold text-white">
              Autorise l’accès à la caméra
            </Text>
            <Text className="mt-2 max-w-[320px] text-center text-[14px] leading-5 text-white/80">
              FoodLens utilise la caméra uniquement pour cadrer et photographier
              ton repas. La photo sert à produire une estimation.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                permission.canAskAgain
                  ? "Autoriser la caméra"
                  : "Ouvrir les réglages"
              }
              onPress={() =>
                void (permission.canAskAgain ? enableCamera() : openSettings())
              }
              className="mt-6 min-h-12 items-center justify-center rounded-full bg-white px-7"
            >
              <Text className="font-bold text-brand-primary">
                {permission.canAskAgain ? "Autoriser" : "Ouvrir les réglages"}
              </Text>
            </Pressable>
            {message ? (
              <Text
                accessibilityRole="alert"
                className="mt-4 text-center text-[12px] text-white"
              >
                {message}
              </Text>
            ) : null}
          </View>
        ) : null}

        {permission === null ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text className="mt-3 text-white">Préparation de la caméra…</Text>
          </View>
        ) : null}

        {hasPermission && cameraUnavailable && !image ? (
          <View className="flex-1 items-center justify-center px-5">
            <Text className="text-center text-[22px] font-bold text-white">
              Caméra indisponible
            </Text>
            <Text className="mt-2 text-center text-[14px] leading-5 text-white/80">
              Tu peux tout de même choisir une photo dans ta galerie.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Réessayer la caméra"
              onPress={() => void retryCamera()}
              className="mt-5 min-h-12 items-center justify-center rounded-full bg-white px-6"
            >
              <Text className="font-bold text-brand-primary">Réessayer</Text>
            </Pressable>
          </View>
        ) : null}

        {hasPermission && !cameraUnavailable && !image ? (
          <View className="mb-1">
            {mode === "photo" ? (
              <Text className="mb-4 text-center text-[13px] font-semibold text-white">
                Cadre ton plat dans la zone de capture
              </Text>
            ) : (
              <Text className="mb-4 text-center text-[13px] font-semibold text-white">
                Place le code-barres dans le champ de la caméra
              </Text>
            )}

            {barcode ? (
              <View className="mb-4 rounded-[16px] bg-black/70 p-4">
                <Text className="text-center text-[14px] font-bold text-white">
                  Code détecté
                </Text>
                <Text
                  selectable
                  className="mt-1 text-center text-[13px] text-white"
                >
                  {barcode.data}
                </Text>
                <Text className="mt-2 text-center text-[11px] leading-4 text-white/75">
                  Le catalogue produit n’est pas disponible hors ligne.
                </Text>
              </View>
            ) : null}

            <View className="mb-5 flex-row self-center rounded-full bg-black/55 p-1">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mode photo"
                accessibilityState={{ selected: mode === "photo" }}
                onPress={() => {
                  setMode("photo");
                  setBarcode(null);
                }}
                className={`min-h-11 items-center justify-center rounded-full px-5 ${
                  mode === "photo" ? "bg-white" : ""
                }`}
              >
                <Text
                  className={`text-[12px] font-bold ${mode === "photo" ? "text-ink-light" : "text-white"}`}
                >
                  Photo
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mode code-barres"
                accessibilityState={{ selected: mode === "barcode" }}
                onPress={() => {
                  setMode("barcode");
                  setBarcode(null);
                }}
                className={`min-h-11 items-center justify-center rounded-full px-4 ${
                  mode === "barcode" ? "bg-white" : ""
                }`}
              >
                <Text
                  className={`text-[12px] font-bold ${mode === "barcode" ? "text-ink-light" : "text-white"}`}
                >
                  Code-barres
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ajouter un repas manuellement"
                onPress={() => router.push("/entry")}
                className="min-h-11 items-center justify-center rounded-full px-4"
              >
                <Text className="text-[12px] font-bold text-white">Manuel</Text>
              </Pressable>
            </View>

            {mode === "photo" ? (
              <View className="flex-row items-center justify-between px-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Importer une image depuis la galerie"
                  disabled={isPickingImage || isCapturing}
                  onPress={() => void chooseImage()}
                  className="h-12 min-w-12 items-center justify-center rounded-full bg-black/50 px-3 disabled:opacity-50"
                >
                  <Text className="text-[12px] font-bold text-white">
                    Galerie
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Prendre une photo"
                  disabled={!cameraReady || isCapturing || isPickingImage}
                  onPress={() => void takePhoto()}
                  className="h-[78px] w-[78px] items-center justify-center rounded-full border-[4px] border-white disabled:opacity-50"
                >
                  <View className="h-[60px] w-[60px] rounded-full bg-white" />
                </Pressable>
                <View className="min-w-12 items-center">
                  {cameraLoading ||
                  isPickingImage ||
                  isCapturing ||
                  isPreparingImage ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-[11px] font-semibold text-white">
                      {flashMode === "off"
                        ? "Éteint"
                        : flashMode === "auto"
                          ? "Auto"
                          : "Activé"}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choisir une image dans la galerie"
                onPress={() => void chooseImage()}
                className="min-h-12 items-center justify-center rounded-full bg-white/15"
              >
                <Text className="font-bold text-white">Importer une image</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {hasPermission && image ? (
          <View className="mb-1 rounded-[22px] bg-black/75 p-4">
            <Text className="text-center text-[15px] font-bold text-white">
              Photo prête
            </Text>
            <Text className="mt-1 text-center text-[12px] text-white/75">
              L’analyse fournit une estimation, pas une mesure exacte.
            </Text>
            {message ? (
              <Text
                accessibilityRole="alert"
                className="mt-3 text-center text-[12px] text-white"
              >
                {message}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Analyser la photo du plat"
              onPress={analyze}
              className="mt-4 min-h-[54px] items-center justify-center rounded-[16px] bg-brand-primary disabled:opacity-60"
            >
              <Text className="text-[15px] font-bold text-white">Analyser le plat</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reprendre la photo"
              disabled={false}
              onPress={() => {
                setImage(null);
                setCameraReady(false);
                setCameraError(false);
                setMessage(null);
              }}
              className="mt-2 min-h-11 items-center justify-center rounded-[14px] disabled:opacity-50"
            >
              <Text className="font-semibold text-white">
                Reprendre la photo
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>

      {message && hasPermission && !image ? (
        <View className="absolute bottom-28 left-5 right-5 rounded-[14px] bg-black/75 p-3">
          <Text
            accessibilityRole="alert"
            className="text-center text-[12px] text-white"
          >
            {message}
          </Text>
        </View>
      ) : null}

      {isCapturing || isPreparingImage ? (
        <View className="absolute inset-0 items-center justify-center bg-black/55">
          <ActivityIndicator size="large" color={theme.colors.accentDark} />
          <Text className="mt-3 text-[14px] font-semibold text-white">
            Préparation de la photo…
          </Text>
        </View>
      ) : null}
    </View>
  );
}

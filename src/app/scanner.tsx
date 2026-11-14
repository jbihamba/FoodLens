import { Link, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/food/BrandMark";
import { FoodButton } from "@/components/food/FoodButton";
import { StyledImage } from "@/components/nativewind-interop";
import {
  FoodRecognitionError,
  analyzeFoodImage,
} from "@/services/foodRecognition";
import {
  ImageSelectionError,
  selectFoodImage,
  type ImageSource,
  type SelectedFoodImage,
} from "@/services/imagePicker";
import { useScanSession } from "@/stores/scan-session";

export default function ScannerScreen() {
  const params = useLocalSearchParams<{ source?: string }>();
  const { saveScan } = useScanSession();
  const [image, setImage] = useState<SelectedFoodImage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const autoOpenedGallery = useRef(false);

  const chooseImage = useCallback(async (source: ImageSource) => {
    setMessage(null);
    try {
      const selectedImage = await selectFoodImage(source);
      if (selectedImage) {
        setImage(selectedImage);
      }
    } catch (error) {
      setMessage(
        error instanceof ImageSelectionError
          ? error.message
          : "We could not open that image. Please try again.",
      );
    }
  }, []);

  useEffect(() => {
    if (params.source === "gallery" && !autoOpenedGallery.current) {
      autoOpenedGallery.current = true;
      void chooseImage("gallery");
    }
  }, [chooseImage, params.source]);

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

        <View className="h-[285px] overflow-hidden rounded-[25px] border-[0.5px] border-selected-light bg-surface-light dark:border-selected-dark dark:bg-surface-dark">
          {image ? (
            <StyledImage
              source={{ uri: image.uri }}
              contentFit="cover"
              className="h-full w-full"
            />
          ) : (
            <>
              <StyledImage
                source={require('../../assets/images/food-meal.jpg')}
                contentFit="cover"
                className="h-full w-full"
              />
              <View className="absolute bottom-3 left-3 right-3 rounded-[14px] bg-[#202820CC] px-4 py-[11px]">
                <Text className="text-[15px] font-bold text-white">Your plate goes here</Text>
                <Text className="mt-1 text-xs leading-[17px] text-[#E6EDE6]">
                  Try to include the whole meal in the frame.
                </Text>
              </View>
            </>
          )}
          {image ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change selected photo"
              onPress={() => void chooseImage("gallery")}
              className="absolute right-[13px] top-[13px] rounded-2xl bg-[#202820CC] px-[13px] py-2"
            >
              <Text className="text-[11px] font-bold text-white">
                Change photo
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="mt-4 gap-[10px]">
          <FoodButton
            label={image ? "Retake photo" : "Take a photo"}
            variant="secondary"
            trailing="＋"
            onPress={() => void chooseImage("camera")}
          />
          <FoodButton
            label={image ? "Choose another photo" : "Choose from gallery"}
            variant="outline"
            trailing="＋"
            onPress={() => void chooseImage("gallery")}
          />
        </View>

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
            <ActivityIndicator className="text-brand-primary" />
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

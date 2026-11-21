import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const MAX_IMAGE_DIMENSION = 1280;

export class ImageSelectionError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid-image" | "picker",
  ) {
    super(message);
    this.name = "ImageSelectionError";
  }
}

export interface SelectedFoodImage {
  uri: string;
  base64: string;
}

export async function selectFoodImage(): Promise<SelectedFoodImage | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset?.uri) {
      throw new ImageSelectionError(
        "That file could not be used. Choose a different food photo.",
        "invalid-image",
      );
    }

    return await prepareFoodImage(
      asset.uri,
      asset.width,
      asset.height,
      asset.mimeType,
    );
  } catch (error) {
    if (error instanceof ImageSelectionError) {
      throw error;
    }
    throw new ImageSelectionError(
      "We could not open or prepare that image. Please try again.",
      "picker",
    );
  }
}

export async function prepareFoodImage(
  uri: string,
  sourceWidth: number,
  sourceHeight: number,
  mimeType?: string | null,
): Promise<SelectedFoodImage> {
  try {
    if (
      !uri ||
      sourceWidth <= 0 ||
      sourceHeight <= 0 ||
      (mimeType && !mimeType.startsWith("image/"))
    ) {
      throw new ImageSelectionError(
        "That file could not be used. Choose a different food photo.",
        "invalid-image",
      );
    }

    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(sourceWidth, sourceHeight),
    );
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const context = ImageManipulator.manipulate(uri, {
      maxWidth: MAX_IMAGE_DIMENSION,
      maxHeight: MAX_IMAGE_DIMENSION,
    });
    let selectedImage: SelectedFoodImage | null = null;
    try {
      context.resize({ width, height });
      const imageRef = await context.renderAsync();
      try {
        const optimizedImage = await imageRef.saveAsync({
          base64: true,
          compress: 0.78,
          format: SaveFormat.JPEG,
        });
        if (!optimizedImage.base64) {
          throw new ImageSelectionError(
            "We could not prepare that photo. Please try another image.",
            "invalid-image",
          );
        }
        selectedImage = {
          uri: optimizedImage.uri,
          base64: optimizedImage.base64,
        };
      } finally {
        imageRef.release();
      }
    } finally {
      context.release();
    }

    if (!selectedImage) {
      throw new ImageSelectionError(
        "We could not prepare that photo. Please try another image.",
        "invalid-image",
      );
    }

    return selectedImage;
  } catch (error) {
    if (error instanceof ImageSelectionError) {
      throw error;
    }
    throw new ImageSelectionError(
      "We could not prepare that photo. Please try another image.",
      "picker",
    );
  }
}

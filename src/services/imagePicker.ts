import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const MAX_IMAGE_DIMENSION = 1280;

export type ImageSource = 'camera' | 'gallery';

export class ImageSelectionError extends Error {
  constructor(
    message: string,
    readonly kind: 'permission' | 'invalid-image' | 'picker',
  ) {
    super(message);
    this.name = 'ImageSelectionError';
  }
}

export interface SelectedFoodImage {
  uri: string;
  base64: string;
}

export async function selectFoodImage(source: ImageSource): Promise<SelectedFoodImage | null> {
  try {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new ImageSelectionError(
        source === 'camera'
          ? 'Camera access is needed to take a food photo.'
          : 'Photo access is needed to choose a food image.',
        'permission',
      );
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    if (
      !asset?.uri ||
      asset.width <= 0 ||
      asset.height <= 0 ||
      (asset.mimeType && !asset.mimeType.startsWith('image/'))
    ) {
      throw new ImageSelectionError(
        'That file could not be used. Choose a different food photo.',
        'invalid-image',
      );
    }

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(asset.width, asset.height));
    const width = Math.max(1, Math.round(asset.width * scale));
    const height = Math.max(1, Math.round(asset.height * scale));
    const context = ImageManipulator.manipulate(asset.uri, {
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
            'We could not prepare that photo. Please try another image.',
            'invalid-image',
          );
        }
        selectedImage = { uri: optimizedImage.uri, base64: optimizedImage.base64 };
      } finally {
        imageRef.release();
      }
    } finally {
      context.release();
    }

    if (!selectedImage) {
      throw new ImageSelectionError(
        'We could not prepare that photo. Please try another image.',
        'invalid-image',
      );
    }

    return selectedImage;
  } catch (error) {
    if (error instanceof ImageSelectionError) {
      throw error;
    }
    throw new ImageSelectionError(
      'We could not open or prepare that image. Please try again.',
      'picker',
    );
  }
}

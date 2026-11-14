import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/food/BrandMark';
import { FoodButton } from '@/components/food/FoodButton';
import { BrandColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FoodRecognitionError, analyzeFoodImage } from '@/services/foodRecognition';
import {
  ImageSelectionError,
  selectFoodImage,
  type ImageSource,
  type SelectedFoodImage,
} from '@/services/imagePicker';
import { useScanSession } from '@/stores/scan-session';

export default function ScannerScreen() {
  const theme = useTheme();
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
          : 'We could not open that image. Please try again.',
      );
    }
  }, []);

  useEffect(() => {
    if (params.source === 'gallery' && !autoOpenedGallery.current) {
      autoOpenedGallery.current = true;
      void chooseImage('gallery');
    }
  }, [chooseImage, params.source]);

  const analyze = async () => {
    if (!image) {
      setMessage('Take a photo or choose one from your gallery first.');
      return;
    }

    setMessage(null);
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeFoodImage(image.base64);
      saveScan({ imageUri: image.uri, analysis });
      router.replace('/result');
    } catch (error) {
      setMessage(
        error instanceof FoodRecognitionError
          ? error.message
          : 'Something went wrong while analyzing your meal. Please try again.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/" asChild>
            <Pressable accessibilityRole="button" style={styles.backButton}>
              <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
            </Pressable>
          </Link>
          <View style={styles.brand}>
            <BrandMark size={34} />
            <Text style={[styles.brandName, { color: theme.text }]}>FoodLens</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.intro}>
          <Text style={[styles.kicker, { color: BrandColors.primary }]}>MEAL SCANNER</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Let&apos;s take a{'\n'}closer look.
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            A clear photo helps us make a better estimate.
          </Text>
        </View>

        <View
          style={[
            styles.previewCard,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          {image ? (
            <Image source={{ uri: image.uri }} contentFit="cover" style={styles.previewImage} />
          ) : (
            <View style={styles.emptyPreview}>
              <View style={styles.previewPlate}>
                <View style={styles.previewPlateInner}>
                  <View style={styles.previewDot} />
                  <View style={styles.previewLeaf} />
                </View>
              </View>
              <Text style={[styles.previewTitle, { color: theme.text }]}>Your plate goes here</Text>
              <Text style={[styles.previewHint, { color: theme.textSecondary }]}>
                Try to include the whole meal in the frame.
              </Text>
            </View>
          )}
          {image ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change selected photo"
              onPress={() => void chooseImage('gallery')}
              style={styles.changeBadge}>
              <Text style={styles.changeBadgeText}>Change photo</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.imageActions}>
          <FoodButton
            label={image ? 'Retake photo' : 'Take a photo'}
            variant="secondary"
            trailing="＋"
            onPress={() => void chooseImage('camera')}
          />
          <FoodButton
            label={image ? 'Choose another photo' : 'Choose from gallery'}
            variant="outline"
            trailing="＋"
            onPress={() => void chooseImage('gallery')}
          />
        </View>

        {message ? (
          <View
            accessibilityRole="alert"
            style={[styles.messageCard, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.messageText, { color: theme.text }]}>{message}</Text>
          </View>
        ) : null}

        <FoodButton
          label={isAnalyzing ? 'Taking a closer look…' : 'Analyze my meal'}
          hint={isAnalyzing ? undefined : 'Your photo is only used for this estimate'}
          trailing={isAnalyzing ? undefined : '→'}
          disabled={!image || isAnalyzing}
          onPress={() => void analyze()}
          style={styles.analyzeButton}
        />
        {isAnalyzing ? (
          <View style={styles.loading}>
            <ActivityIndicator color={BrandColors.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Identifying foods and estimating a portion…
            </Text>
          </View>
        ) : (
          <Text style={[styles.privacyNote, { color: theme.textSecondary }]}>
            Estimates can vary with ingredients, portions, and preparation.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 37,
    lineHeight: 40,
    marginTop: -4,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  intro: {
    paddingTop: 21,
    paddingBottom: 21,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '700',
  },
  title: {
    marginTop: 10,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
  },
  previewCard: {
    height: 285,
    borderRadius: 25,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  previewPlate: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 7,
    borderColor: '#E5E8DF',
    backgroundColor: '#F1F4ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlateInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: '#D7DED4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDot: {
    width: 33,
    height: 33,
    borderRadius: 18,
    backgroundColor: '#E9B56F',
    marginLeft: -12,
  },
  previewLeaf: {
    position: 'absolute',
    width: 25,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#8BA47D',
    right: 8,
    top: 7,
    transform: [{ rotate: '30deg' }],
  },
  previewTitle: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: '700',
  },
  previewHint: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
  },
  changeBadge: {
    position: 'absolute',
    right: 13,
    top: 13,
    backgroundColor: '#202820CC',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 16,
  },
  changeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  imageActions: {
    marginTop: 16,
    gap: 10,
  },
  messageCard: {
    marginTop: 15,
    padding: 14,
    borderRadius: 14,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  analyzeButton: {
    marginTop: 19,
  },
  loading: {
    minHeight: 46,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  loadingText: {
    fontSize: 12,
  },
  privacyNote: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
  },
});

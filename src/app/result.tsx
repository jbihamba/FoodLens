import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/food/BrandMark';
import { FoodButton } from '@/components/food/FoodButton';
import { BrandColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useScanSession } from '@/stores/scan-session';

export default function ResultScreen() {
  const theme = useTheme();
  const { scan, clearScan } = useScanSession();

  const startNewScan = () => {
    clearScan();
    router.replace('/scanner');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        {!scan ? (
          <View style={styles.emptyState}>
            <Text style={[styles.title, { color: theme.text }]}>No meal to show yet</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Scan a meal to see its estimate here.
            </Text>
            <Link href="/scanner" asChild>
              <FoodButton label="Scan a meal" trailing="→" style={styles.emptyButton} />
            </Link>
          </View>
        ) : (
          <>
            <View style={styles.heading}>
              <Text style={styles.kicker}>YOUR MEAL, AT A GLANCE</Text>
              <Text style={[styles.title, { color: theme.text }]}>{scan.analysis.foodName}</Text>
            </View>

            <View style={styles.photoCard}>
              <Image source={{ uri: scan.imageUri }} contentFit="cover" style={styles.photo} />
              <View style={styles.photoTag}>
                <Text style={styles.photoTagText}>FOODLENS ESTIMATE</Text>
              </View>
            </View>

            <View
              style={[
                styles.calorieCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
              ]}>
              <View style={styles.calorieTop}>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                  ESTIMATED ENERGY
                </Text>
                <View style={styles.calorieIcon}>
                  <Text style={styles.calorieIconText}>kcal</Text>
                </View>
              </View>
              <View style={styles.calories}>
                <Text style={[styles.calorieNumber, { color: theme.text }]}>
                  {scan.analysis.estimatedCalories?.toLocaleString() ?? '—'}
                </Text>
                <Text style={[styles.calorieUnit, { color: theme.textSecondary }]}>kcal</Text>
              </View>
              <Text style={[styles.calorieNote, { color: theme.textSecondary }]}>
                {scan.analysis.estimatedCalories === null
                  ? 'Not enough visual detail for a calorie estimate.'
                  : 'An approximate estimate for the meal shown.'}
              </Text>
              {scan.analysis.portionSize ? (
                <View style={styles.portionRow}>
                  <Text style={[styles.portionLabel, { color: theme.textSecondary }]}>
                    ESTIMATED PORTION
                  </Text>
                  <Text style={[styles.portionValue, { color: theme.text }]}>
                    {scan.analysis.portionSize}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>What we see</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {scan.analysis.description}
              </Text>
              {scan.analysis.confidence !== null ? (
                <View style={styles.confidencePill}>
                  <View style={styles.confidenceDot} />
                  <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>
                    Visual match · {Math.round(scan.analysis.confidence * 100)}%
                  </Text>
                </View>
              ) : null}
            </View>

            {scan.analysis.ingredients.length > 0 ? (
              <View style={styles.ingredientsSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Main ingredients</Text>
                <View style={styles.ingredients}>
                  {scan.analysis.ingredients.map((ingredient) => (
                    <View key={ingredient} style={styles.ingredientPill}>
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.disclaimerCard}>
              <Text style={styles.disclaimerIcon}>i</Text>
              <Text style={styles.disclaimerText}>
                Calories are estimates. Actual nutrition can vary with portion size, ingredients,
                and preparation methods.
              </Text>
            </View>

            <View style={styles.actions}>
              <FoodButton label="Scan another meal" trailing="→" onPress={startNewScan} />
              <Link href="/" asChild>
                <FoodButton label="Back to home" variant="outline" />
              </Link>
            </View>
          </>
        )}
        <View style={styles.footer}>
          <BrandMark size={26} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            A helpful estimate, never a diagnosis.
          </Text>
        </View>
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
    paddingBottom: 34,
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
  heading: {
    paddingTop: 20,
    paddingBottom: 17,
  },
  kicker: {
    color: BrandColors.primary,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '700',
  },
  title: {
    marginTop: 9,
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.7,
    fontWeight: '700',
  },
  photoCard: {
    height: 220,
    borderRadius: 23,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoTag: {
    position: 'absolute',
    left: 13,
    bottom: 13,
    backgroundColor: '#202820CC',
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  photoTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  calorieCard: {
    marginTop: 15,
    padding: 19,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
  },
  calorieTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  calorieIcon: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: BrandColors.secondary,
  },
  calorieIconText: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  calories: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  calorieNumber: {
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -2,
    fontWeight: '700',
  },
  calorieUnit: {
    fontSize: 15,
    fontWeight: '600',
  },
  calorieNote: {
    fontSize: 12,
    lineHeight: 18,
  },
  portionRow: {
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BrandColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portionLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  portionValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  },
  description: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
  },
  confidencePill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: BrandColors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.primary,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ingredientsSection: {
    paddingTop: 23,
  },
  ingredients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 11,
  },
  ingredientPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: BrandColors.secondary,
  },
  ingredientText: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  disclaimerCard: {
    marginTop: 24,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#F4EBDD',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  disclaimerIcon: {
    width: 19,
    height: 19,
    borderRadius: 10,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 19,
    color: '#78572F',
    backgroundColor: '#E9D1AF',
    fontSize: 12,
    fontWeight: '700',
  },
  disclaimerText: {
    flex: 1,
    color: '#705C42',
    fontSize: 11,
    lineHeight: 17,
  },
  actions: {
    marginTop: 22,
    gap: 10,
  },
  emptyState: {
    flex: 1,
    minHeight: 430,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButton: {
    marginTop: 22,
    alignSelf: 'stretch',
  },
  footer: {
    marginTop: 28,
    paddingTop: 17,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BrandColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  footerText: {
    fontSize: 11,
  },
});

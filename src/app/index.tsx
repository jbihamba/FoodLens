import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/food/BrandMark";
import { FoodButton } from "@/components/food/FoodButton";
import { BrandColors, Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const steps = [
  {
    number: "01",
    title: "Snap your meal",
    description: "Take a photo or choose one you love.",
  },
  {
    number: "02",
    title: "Let FoodLens look",
    description: "AI identifies the foods on your plate.",
  },
  {
    number: "03",
    title: "Get an estimate",
    description: "See a helpful calorie and portion estimate.",
  },
];

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <BrandMark />
            <Text style={[styles.brandName, { color: theme.text }]}>
              FoodLens
            </Text>
          </View>
          <Text style={[styles.headerNote, { color: theme.textSecondary }]}>
            YOUR FOOD, IN FOCUS
          </Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>A FRESH LOOK AT EVERY MEAL</Text>
          </View>
          <Text style={[styles.headline, { color: theme.text }]}>
            Eat well,{"\n"}
            <Text
              style={[
                styles.headlineAccent,
                {
                  color:
                    theme.background === Colors.dark.background
                      ? "#A8C8B2"
                      : BrandColors.primary,
                },
              ]}
            >
              know more.
            </Text>
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Discover what&apos;s on your plate.
          </Text>

          <View style={styles.plateCard}>
            <View style={styles.plateOuter}>
              <View style={styles.plateInner}>
                <View style={[styles.plateFood, styles.foodGreen]} />
                <View style={[styles.plateFood, styles.foodOrange]} />
                <View style={[styles.plateFood, styles.foodCream]} />
                <View style={styles.plateLeaf} />
              </View>
            </View>
            <View style={styles.cardCaption}>
              <Text style={styles.cardTitle}>A little more mindful</Text>
              <Text style={styles.cardSubtitle}>One meal at a time</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Link href="/scanner" asChild>
              <FoodButton
                label="Scan my food"
                hint="Use your camera or choose a photo"
                trailing="→"
              />
            </Link>
          </View>
          <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
            Calorie and portion values are estimates, not medical advice.
          </Text>
        </View>

        <View style={styles.howSection}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              How it works
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
            >
              Good food choices start with curiosity.
            </Text>
          </View>
          <View style={styles.steps}>
            {steps.map((step) => (
              <View
                key={step.number}
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                  },
                ]}
              >
                <Text style={styles.stepNumber}>{step.number}</Text>
                <View style={styles.stepCopy}>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    {step.title}
                  </Text>
                  <Text
                    style={[
                      styles.stepDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <BrandMark size={28} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Made for a more mindful plate.
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
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  header: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  brandName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerNote: {
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  hero: {
    paddingTop: 29,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BrandColors.accent,
  },
  eyebrowText: {
    color: BrandColors.primary,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  headline: {
    marginTop: 17,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -2,
    fontWeight: "700",
  },
  headlineAccent: {
    color: BrandColors.primary,
  },
  description: {
    marginTop: 11,
    fontSize: 17,
    lineHeight: 25,
  },
  plateCard: {
    height: 190,
    marginTop: 25,
    borderRadius: 28,
    backgroundColor: BrandColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    overflow: "hidden",
  },
  plateOuter: {
    width: 138,
    height: 138,
    borderRadius: 70,
    backgroundColor: "#F6F1E4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10251A",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  plateInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: "#D9D4C9",
    backgroundColor: "#F1EBDD",
    alignItems: "center",
    justifyContent: "center",
  },
  plateFood: {
    position: "absolute",
    borderRadius: 30,
  },
  foodGreen: {
    width: 41,
    height: 53,
    backgroundColor: "#85A873",
    left: 18,
    top: 21,
    transform: [{ rotate: "-32deg" }],
  },
  foodOrange: {
    width: 39,
    height: 40,
    backgroundColor: BrandColors.accent,
    right: 15,
    top: 18,
    transform: [{ rotate: "24deg" }],
  },
  foodCream: {
    width: 52,
    height: 35,
    backgroundColor: "#E4C883",
    left: 32,
    bottom: 17,
    transform: [{ rotate: "-8deg" }],
  },
  plateLeaf: {
    position: "absolute",
    right: 23,
    bottom: 19,
    width: 19,
    height: 32,
    borderRadius: 20,
    backgroundColor: "#527C54",
    transform: [{ rotate: "32deg" }],
  },
  cardCaption: {
    maxWidth: 110,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#DCEBDD",
    fontSize: 12,
    marginTop: 7,
  },
  sparkle: {
    position: "absolute",
    right: 22,
    top: 18,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#FFFFFF20",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleText: {
    color: "#F7C58F",
    fontSize: 14,
  },
  actions: {
    marginTop: 23,
    gap: 11,
  },
  disclaimer: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
  },
  howSection: {
    marginTop: 43,
  },
  sectionHeading: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
  },
  steps: {
    gap: 10,
  },
  stepCard: {
    minHeight: 78,
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  stepNumber: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  stepCopy: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    marginTop: 34,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BrandColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  footerText: {
    fontSize: 12,
  },
});

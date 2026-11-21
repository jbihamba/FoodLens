/**
 * @file app/calorie-goal-wizard.tsx
 *
 * Formulaire d'onboarding en 3 étapes pour configurer l'objectif calorique :
 *   Étape 1 — Infos corporelles (sexe, âge, poids, taille, unités)
 *   Étape 2 — Niveau d'activité
 *   Étape 3 — Objectif de poids + résultat avec détail repliable
 *
 * Accessibilité : zones tactiles ≥ 44 px, libellés aria, clavier numérique.
 */
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable as NativePressable,
  Platform,
  ScrollView,
  View,
  type ScrollViewInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FoodButton } from "@/components/food/FoodButton";
import { Pressable, Text, TextInput } from "@/components/LocalizedText";
import {
  ACTIVITY_DESCRIPTIONS,
  ACTIVITY_LABELS,
  CALORIE_FLOOR,
  MAX_MANUAL_GOAL,
  WEIGHT_GOAL_LABELS,
  type ActivityLevel,
  type WeightGoal,
} from "@/constants/nutrition";
import { useCalorieGoal } from "@/hooks/useCalorieGoal";
import {
  calculateCalorieGoal,
  ftInToCm,
  lbsToKg,
  validateProfile,
} from "@/services/nutrition/calorieGoal";
import { useDailyCalories } from "@/stores/daily-calories";
import type { CalorieGoalResult, Sex, UserProfile } from "@/types/profile";

// ---------------------------------------------------------------------------
// Types internes du formulaire
// ---------------------------------------------------------------------------

type UnitSystem = "metric" | "imperial";

interface FormState {
  sex: Sex;
  age: string;
  weightKg: string;
  weightLbs: string;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
  isPregnantOrBreastfeeding: boolean;
  unitSystem: UnitSystem;
}

const INITIAL_FORM: FormState = {
  sex: "female",
  age: "",
  weightKg: "",
  weightLbs: "",
  heightCm: "",
  heightFt: "",
  heightIn: "",
  activityLevel: "moderate",
  weightGoal: "maintain",
  isPregnantOrBreastfeeding: false,
  unitSystem: "metric",
};

const STEPS = ["Mes infos", "Mon activité", "Mon objectif"] as const;
type Step = 0 | 1 | 2;

// ---------------------------------------------------------------------------
// Composants de sélection
// ---------------------------------------------------------------------------

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
  accessibilityLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
  accessibilityLabel: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className="flex-row gap-2 flex-wrap"
    >
      {options.map((opt) => (
        <NativePressable
          key={opt}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === opt }}
          accessibilityLabel={labels[opt]}
          onPress={() => onChange(opt)}
          className={`min-h-11 flex-1 items-center justify-center rounded-[13px] px-3 py-2 ${
            value === opt
              ? "bg-brand-primary"
              : "bg-surface-light dark:bg-surface-dark border border-brand-border dark:border-selected-dark"
          }`}
        >
          <Text
            className={`text-center text-[13px] font-semibold ${
              value === opt ? "text-white" : "text-ink-light dark:text-ink-dark"
            }`}
          >
            {labels[opt]}
          </Text>
        </NativePressable>
      ))}
    </View>
  );
}

function ActivityCard({
  level,
  selected,
  onPress,
}: {
  level: ActivityLevel;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <NativePressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={ACTIVITY_LABELS[level].fr}
      onPress={onPress}
      className={`min-h-[60px] flex-row items-center rounded-[16px] px-4 py-3 mb-2 ${
        selected
          ? "bg-brand-primary"
          : "bg-surface-light dark:bg-surface-dark border border-brand-border dark:border-selected-dark"
      }`}
    >
      <View className="flex-1">
        <Text
          className={`text-[14px] font-bold ${
            selected ? "text-white" : "text-ink-light dark:text-ink-dark"
          }`}
        >
          {ACTIVITY_LABELS[level].fr}
        </Text>
        <Text
          className={`text-[11px] mt-[2px] ${
            selected
              ? "text-[#DCEBDD]"
              : "text-muted-light dark:text-muted-dark"
          }`}
        >
          {ACTIVITY_DESCRIPTIONS[level].fr}
        </Text>
      </View>
      {selected && (
        <Text aria-hidden className="text-white text-lg ml-2">
          ✓
        </Text>
      )}
    </NativePressable>
  );
}

function InfoCard({
  variant = "info",
  children,
}: {
  variant?: "info" | "attention";
  children: React.ReactNode;
}) {
  const bg =
    variant === "info"
      ? "bg-[#EDF5F0] dark:bg-[#1E3328]"
      : "bg-[#FFF6E7] dark:bg-[#382C1A]";
  const icon = variant === "info" ? "ℹ" : "◎";
  const iconColor =
    variant === "info"
      ? "text-[#245C45] dark:text-[#A8C8B2]"
      : "text-[#87530C] dark:text-[#F1C879]";

  return (
    <View className={`flex-row gap-3 rounded-[14px] p-4 mt-3 ${bg}`}>
      <Text aria-hidden className={`text-[16px] ${iconColor}`}>
        {icon}
      </Text>
      <View className="flex-1">{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Écrans des étapes
// ---------------------------------------------------------------------------

function StepBodyInfo({
  form,
  onChange,
  errors,
}: {
  form: FormState;
  onChange: (partial: Partial<FormState>) => void;
  errors: Record<string, string>;
}) {
  const isImperial = form.unitSystem === "imperial";

  return (
    <View className="gap-5">
      {/* Unités */}
      <View>
        <Text className="text-[11px] font-bold tracking-[0.8px] text-muted-light dark:text-muted-dark mb-2 uppercase">
          Unités
        </Text>
        <SegmentedControl
          options={["metric", "imperial"] as const}
          value={form.unitSystem}
          onChange={(v) => onChange({ unitSystem: v })}
          labels={{
            metric: "Métrique (kg, cm)",
            imperial: "Impérial (lb, ft/in)",
          }}
          accessibilityLabel="Système d'unités"
        />
      </View>

      {/* Sexe */}
      <View>
        <Text className="text-[11px] font-bold tracking-[0.8px] text-muted-light dark:text-muted-dark mb-2 uppercase">
          Sexe biologique
        </Text>
        <SegmentedControl
          options={["female", "male", "unspecified"] as const}
          value={form.sex}
          onChange={(v) => onChange({ sex: v })}
          labels={{
            female: "Femme",
            male: "Homme",
            unspecified: "Non précisé",
          }}
          accessibilityLabel="Sexe biologique"
        />
        {form.sex === "unspecified" && (
          <InfoCard variant="info">
            <Text className="text-[11px] text-[#245C45] dark:text-[#A8C8B2] leading-4">
              {"Une valeur intermédiaire sera utilisée. L'estimation sera moins précise."}
            </Text>
          </InfoCard>
        )}
      </View>

      {/* Âge */}
      <View>
        <Text className="text-[11px] font-bold tracking-[0.8px] text-muted-light dark:text-muted-dark mb-2 uppercase">
          Âge (ans)
        </Text>
        <View className="flex-row items-center rounded-[14px] border border-brand-border px-4 h-14 bg-surface-light dark:bg-surface-dark dark:border-selected-dark">
          <TextInput
            accessibilityLabel="Votre âge en années"
            className="flex-1 text-[18px] font-semibold text-ink-light dark:text-ink-dark"
            value={form.age}
            onChangeText={(v) => onChange({ age: v })}
            keyboardType="number-pad"
            placeholder="ex. : 30"
            placeholderTextColor="#68736B"
            returnKeyType="next"
          />
          <Text className="text-[13px] text-muted-light dark:text-muted-dark">
            ans
          </Text>
        </View>
        {errors.age ? (
          <Text
            accessibilityRole="alert"
            className="text-[11px] text-[#A53F35] mt-1 leading-4"
          >
            {errors.age}
          </Text>
        ) : null}
      </View>

      {/* Poids */}
      <View>
        <Text className="text-[11px] font-bold tracking-[0.8px] text-muted-light dark:text-muted-dark mb-2 uppercase">
          Poids
        </Text>
        {isImperial ? (
          <View className="flex-row items-center rounded-[14px] border border-brand-border px-4 h-14 bg-surface-light dark:bg-surface-dark dark:border-selected-dark">
            <TextInput
              accessibilityLabel="Votre poids en livres"
              className="flex-1 text-[18px] font-semibold text-ink-light dark:text-ink-dark"
              value={form.weightLbs}
              onChangeText={(v) => onChange({ weightLbs: v })}
              keyboardType="decimal-pad"
              placeholder="ex. : 154"
              placeholderTextColor="#68736B"
            />
            <Text className="text-[13px] text-muted-light dark:text-muted-dark">
              lb
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center rounded-[14px] border border-brand-border px-4 h-14 bg-surface-light dark:bg-surface-dark dark:border-selected-dark">
            <TextInput
              accessibilityLabel="Votre poids en kilogrammes"
              className="flex-1 text-[18px] font-semibold text-ink-light dark:text-ink-dark"
              value={form.weightKg}
              onChangeText={(v) => onChange({ weightKg: v })}
              keyboardType="decimal-pad"
              placeholder="ex. : 70"
              placeholderTextColor="#68736B"
            />
            <Text className="text-[13px] text-muted-light dark:text-muted-dark">
              kg
            </Text>
          </View>
        )}
        {errors.weightKg ? (
          <Text
            accessibilityRole="alert"
            className="text-[11px] text-[#A53F35] mt-1 leading-4"
          >
            {errors.weightKg}
          </Text>
        ) : null}
      </View>

      {/* Taille */}
      <View>
        <Text className="text-[11px] font-bold tracking-[0.8px] text-muted-light dark:text-muted-dark mb-2 uppercase">
          Taille
        </Text>
        {isImperial ? (
          <View className="flex-row gap-2">
            <View className="flex-1 flex-row items-center rounded-[14px] border border-brand-border px-4 h-14 bg-surface-light dark:bg-surface-dark dark:border-selected-dark">
              <TextInput
                accessibilityLabel="Votre taille en pieds"
                className="flex-1 text-[18px] font-semibold text-ink-light dark:text-ink-dark"
                value={form.heightFt}
                onChangeText={(v) => onChange({ heightFt: v })}
                keyboardType="number-pad"
                placeholder="5"
                placeholderTextColor="#68736B"
              />
              <Text className="text-[13px] text-muted-light dark:text-muted-dark">
                ft
              </Text>
            </View>
            <View className="flex-1 flex-row items-center rounded-[14px] border border-brand-border px-4 h-14 bg-surface-light dark:bg-surface-dark dark:border-selected-dark">
              <TextInput
                accessibilityLabel="Votre taille en pouces"
                className="flex-1 text-[18px] font-semibold text-ink-light dark:text-ink-dark"
                value={form.heightIn}
                onChangeText={(v) => onChange({ heightIn: v })}
                keyboardType="number-pad"
                placeholder="9"
                placeholderTextColor="#68736B"
              />
              <Text className="text-[13px] text-muted-light dark:text-muted-dark">
                in
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center rounded-[14px] border border-brand-border px-4 h-14 bg-surface-light dark:bg-surface-dark dark:border-selected-dark">
            <TextInput
              accessibilityLabel="Votre taille en centimètres"
              className="flex-1 text-[18px] font-semibold text-ink-light dark:text-ink-dark"
              value={form.heightCm}
              onChangeText={(v) => onChange({ heightCm: v })}
              keyboardType="number-pad"
              placeholder="ex. : 170"
              placeholderTextColor="#68736B"
            />
            <Text className="text-[13px] text-muted-light dark:text-muted-dark">
              cm
            </Text>
          </View>
        )}
        {errors.heightCm ? (
          <Text
            accessibilityRole="alert"
            className="text-[11px] text-[#A53F35] mt-1 leading-4"
          >
            {errors.heightCm}
          </Text>
        ) : null}
      </View>

      {/* Grossesse / allaitement */}
      <NativePressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: form.isPregnantOrBreastfeeding }}
        accessibilityLabel="Je suis enceinte ou j'allaite"
        onPress={() =>
          onChange({
            isPregnantOrBreastfeeding: !form.isPregnantOrBreastfeeding,
          })
        }
        className="flex-row items-center gap-3 min-h-11 py-1"
      >
        <View
          className={`h-6 w-6 rounded-[6px] items-center justify-center border ${
            form.isPregnantOrBreastfeeding
              ? "bg-brand-primary border-brand-primary"
              : "border-brand-border dark:border-selected-dark bg-surface-light dark:bg-surface-dark"
          }`}
        >
          {form.isPregnantOrBreastfeeding && (
            <Text aria-hidden className="text-white text-[13px] font-bold">
              ✓
            </Text>
          )}
        </View>
        <Text className="text-[13px] text-ink-light dark:text-ink-dark flex-1">
          {"Je suis enceinte ou j'allaite"}
        </Text>
      </NativePressable>
    </View>
  );
}

function StepActivity({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (partial: Partial<FormState>) => void;
}) {
  const levels: ActivityLevel[] = [
    "sedentary",
    "light",
    "moderate",
    "active",
    "veryActive",
  ];
  return (
    <View>
      <Text className="text-[13px] text-muted-light dark:text-muted-dark mb-4 leading-5">
        Choisissez le niveau qui décrit le mieux votre semaine habituelle.
      </Text>
      {levels.map((level) => (
        <ActivityCard
          key={level}
          level={level}
          selected={form.activityLevel === level}
          onPress={() => onChange({ activityLevel: level })}
        />
      ))}
    </View>
  );
}

function StepGoal({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (partial: Partial<FormState>) => void;
}) {
  const goals: WeightGoal[] = ["lose", "maintain", "gain"];
  return (
    <View className="gap-4">
      <Text className="text-[13px] text-muted-light dark:text-muted-dark leading-5">
        Votre objectif aide à ajuster votre apport calorique recommandé.
      </Text>
      {goals.map((goal) => (
        <NativePressable
          key={goal}
          accessibilityRole="radio"
          accessibilityState={{ checked: form.weightGoal === goal }}
          accessibilityLabel={WEIGHT_GOAL_LABELS[goal].fr}
          onPress={() => onChange({ weightGoal: goal })}
          className={`min-h-14 flex-row items-center rounded-[16px] px-4 py-3 ${
            form.weightGoal === goal
              ? "bg-brand-primary"
              : "bg-surface-light dark:bg-surface-dark border border-brand-border dark:border-selected-dark"
          }`}
        >
          <Text
            className={`flex-1 text-[14px] font-bold ${
              form.weightGoal === goal
                ? "text-white"
                : "text-ink-light dark:text-ink-dark"
            }`}
          >
            {WEIGHT_GOAL_LABELS[goal].fr}
          </Text>
          {form.weightGoal === goal && (
            <Text aria-hidden className="text-white text-lg">
              ✓
            </Text>
          )}
        </NativePressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Écran de résultat
// ---------------------------------------------------------------------------

function ResultScreen({
  result,
  profile,
  onUse,
  onManualEdit,
  isSaving,
}: {
  result: CalorieGoalResult;
  profile: UserProfile;
  onUse: () => void;
  onManualEdit: () => void;
  isSaving: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Objectif principal */}
      <View className="items-center py-6">
        <Text className="text-[11px] font-bold tracking-[1.2px] text-brand-primary dark:text-[#A8C8B2] mb-2 uppercase">
          Objectif quotidien recommandé
        </Text>
        <Text className="text-[64px] font-extrabold text-ink-light dark:text-ink-dark leading-[72px]">
          {result.target}
        </Text>
        <Text className="text-[16px] font-semibold text-muted-light dark:text-muted-dark">
          kcal / jour
        </Text>
        {result.floorApplied && (
          <View className="mt-1 px-3 py-1 rounded-full bg-[#FFF6E7] dark:bg-[#382C1A]">
            <Text className="text-[11px] font-semibold text-[#87530C] dark:text-[#F1C879]">
              Plancher de sécurité appliqué
            </Text>
          </View>
        )}
      </View>

      {/* Warnings */}
      {result.warnings.map((w) => (
        <InfoCard
          key={w.key}
          variant={
            w.key === "floorApplied" || w.key === "tdeeNearFloor"
              ? "attention"
              : "info"
          }
        >
          <Text className="text-[12px] leading-[18px] text-[#245C45] dark:text-[#A8C8B2]">
            {w.messageFr}
          </Text>
        </InfoCard>
      ))}

      {/* Détail repliable */}
      <NativePressable
        accessibilityRole="button"
        accessibilityLabel={
          detailOpen ? "Fermer le détail du calcul" : "Voir le détail du calcul"
        }
        onPress={() => setDetailOpen((v) => !v)}
        className="min-h-11 flex-row items-center justify-between mt-4 px-1 py-2"
      >
        <Text className="text-[13px] font-semibold text-muted-light dark:text-muted-dark">
          Voir le détail du calcul
        </Text>
        <Text
          aria-hidden
          className="text-[18px] text-muted-light dark:text-muted-dark"
        >
          {detailOpen ? "▾" : "›"}
        </Text>
      </NativePressable>

      {detailOpen && (
        <View className="rounded-[16px] bg-surface-light dark:bg-surface-dark p-4 gap-3 mb-2">
          <DetailRow
            label="Métabolisme de base (BMR)"
            value={`${Math.round(result.bmr)} kcal`}
          />
          <DetailRow
            label={`× Coefficient d'activité`}
            value={`= ${Math.round(result.tdee)} kcal (TDEE)`}
          />
          <DetailRow
            label="Ajustement objectif"
            value={`${result.target - Math.round(result.tdee) >= 0 ? "+" : ""}${result.target - Math.round(result.tdee)} kcal`}
          />
          <View className="h-px bg-brand-border dark:bg-selected-dark" />
          <DetailRow
            label="Objectif final"
            value={`${result.target} kcal`}
            isTotal
          />
        </View>
      )}

      {/* Mention légale */}
      <InfoCard variant="info">
        <Text className="text-[11px] text-[#245C45] dark:text-[#A8C8B2] leading-4">
          {"Estimation basée sur la formule de Mifflin-St Jeor. Les besoins réels varient d'une personne à l'autre. Estimation indicative, ne remplace pas l'avis d'un professionnel de santé."}
        </Text>
      </InfoCard>

      {/* Actions */}
      <View className="mt-5 gap-3 pb-6">
        <FoodButton
          label={isSaving ? "Enregistrement…" : "Utiliser cet objectif"}
          trailing={isSaving ? undefined : "→"}
          disabled={isSaving}
          onPress={onUse}
        />
        <FoodButton
          label="Modifier manuellement"
          variant="outline"
          disabled={isSaving}
          onPress={onManualEdit}
        />
      </View>
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
  isTotal,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={`text-[12px] flex-1 mr-2 ${
          isTotal
            ? "font-bold text-ink-light dark:text-ink-dark"
            : "text-muted-light dark:text-muted-dark"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-[13px] ${
          isTotal
            ? "font-bold text-brand-primary dark:text-[#A8C8B2]"
            : "font-semibold text-ink-light dark:text-ink-dark"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Écran de saisie manuelle
// ---------------------------------------------------------------------------

function ManualGoalScreen({
  currentTarget,
  sex,
  onSave,
  onCancel,
  isSaving,
}: {
  currentTarget: number;
  sex: "male" | "female" | "unspecified";
  onSave: (kcal: number) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const floor = sex === "male" ? CALORIE_FLOOR.male : CALORIE_FLOOR.female;
  const [value, setValue] = useState(String(currentTarget));
  const [manualError, setManualError] = useState<string | null>(null);

  const handleSave = () => {
    const n = Number(value.trim());
    if (!Number.isFinite(n) || n <= 0) {
      setManualError("Saisissez un nombre entier de calories.");
      return;
    }
    if (n < floor) {
      setManualError(
        `Par sécurité, l'objectif ne peut pas être inférieur à ${floor} kcal/jour. Cette limite est une convention diététique commune.`,
      );
      return;
    }
    if (n > MAX_MANUAL_GOAL) {
      setManualError(
        `L'objectif ne peut pas dépasser ${MAX_MANUAL_GOAL} kcal/jour.`,
      );
      return;
    }
    setManualError(null);
    onSave(n);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-9 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-[22px] font-bold text-ink-light dark:text-ink-dark mb-2">
          Objectif personnalisé
        </Text>
        <Text className="text-[13px] text-muted-light dark:text-muted-dark mb-6 leading-5">
          Vous pouvez saisir votre propre objectif. Pour votre sécurité, le
          minimum autorisé est de {floor} kcal/jour.
        </Text>

        <View className="rounded-[21px] border border-brand-border dark:border-selected-dark bg-surface-light dark:bg-surface-dark p-5">
          <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-muted-light dark:text-muted-dark mb-3">
            Objectif calorique
          </Text>
          <View className="flex-row items-center rounded-[14px] border border-brand-border dark:border-selected-dark px-4 h-14">
            <TextInput
              accessibilityLabel="Objectif calorique personnel en kilocalories"
              className="flex-1 text-[20px] font-bold text-ink-light dark:text-ink-dark"
              value={value}
              onChangeText={(v) => {
                setValue(v);
                setManualError(null);
              }}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <Text className="text-[13px] font-semibold text-muted-light dark:text-muted-dark">
              kcal
            </Text>
          </View>
          <Text className="text-[11px] text-muted-light dark:text-muted-dark mt-2 leading-4">
            Entre {floor} et {MAX_MANUAL_GOAL} kcal/jour.
          </Text>
        </View>

        {manualError ? (
          <InfoCard variant="attention">
            <Text className="text-[12px] text-[#87530C] dark:text-[#F1C879] leading-4">
              {manualError}
            </Text>
          </InfoCard>
        ) : null}

        <InfoCard variant="info">
          <Text className="text-[11px] text-[#245C45] dark:text-[#A8C8B2] leading-4">
            {"Estimation indicative, ne remplace pas l'avis d'un professionnel de santé."}
          </Text>
        </InfoCard>

        <View className="mt-5 gap-3">
          <FoodButton
            label={isSaving ? "Enregistrement…" : "Enregistrer cet objectif"}
            trailing={isSaving ? undefined : "→"}
            disabled={isSaving}
            onPress={handleSave}
          />
          <FoodButton
            label="Annuler"
            variant="outline"
            disabled={isSaving}
            onPress={onCancel}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Écran principal du wizard
// ---------------------------------------------------------------------------

export default function CalorieGoalWizardScreen() {
  const { saveProfile, saveManualGoal } = useCalorieGoal();
  const { setGoal } = useDailyCalories();
  const scrollRef = useRef<ScrollViewInstance | null>(null);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [step, setStep] = useState<Step>(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<CalorieGoalResult | null>(
    null,
  );
  const [showManual, setShowManual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateForm = (partial: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  // Conversion des valeurs de formulaire en profil SI
  const buildProfile = (): UserProfile => {
    const isImperial = form.unitSystem === "imperial";
    const weightKg = isImperial
      ? lbsToKg(parseFloat(form.weightLbs) || 0)
      : parseFloat(form.weightKg) || 0;
    const heightCm = isImperial
      ? ftInToCm(parseFloat(form.heightFt) || 0, parseFloat(form.heightIn) || 0)
      : parseFloat(form.heightCm) || 0;

    return {
      sex: form.sex,
      age: parseInt(form.age, 10) || 0,
      weightKg,
      heightCm,
      activityLevel: form.activityLevel,
      weightGoal: form.weightGoal,
      isPregnantOrBreastfeeding: form.isPregnantOrBreastfeeding,
    };
  };

  const validateStep0 = (): boolean => {
    const profile = buildProfile();
    const validationErrors = validateProfile(profile);
    const errorMap: Record<string, string> = {};
    for (const e of validationErrors) {
      errorMap[e.field] = e.messageFr;
    }
    setFieldErrors(errorMap);
    return validationErrors.length === 0;
  };

  const handleNext = () => {
    if (step === 0) {
      if (!validateStep0()) return;
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Calculer et afficher le résultat
      const profile = buildProfile();
      const result = calculateCalorieGoal(profile);
      setPreviewResult(result);
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleBack = () => {
    if (previewResult && !showManual) {
      setPreviewResult(null);
      return;
    }
    if (showManual) {
      setShowManual(false);
      return;
    }
    if (step > 0) {
      setStep((s) => (s - 1) as Step);
    } else {
      router.back();
    }
  };

  const handleUseGoal = async () => {
    if (!previewResult) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const profile = buildProfile();
      await saveProfile(profile);
      await setGoal(previewResult.target);
      router.back();
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer l'objectif.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async (kcal: number) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const profile = buildProfile();
      await saveProfile(profile);
      const err = await saveManualGoal(kcal);
      if (err) {
        setSaveError(err.messageFr);
        return;
      }
      await setGoal(kcal);
      router.back();
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer l'objectif.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- Rendu de l'écran de résultat ou de saisie manuelle ---
  if (previewResult) {
    if (showManual) {
      return (
        <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
          <View className="mx-auto w-full max-w-[560px] flex-1">
            <View className="min-h-[58px] flex-row items-center px-6">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour au résultat"
                onPress={() => setShowManual(false)}
                className="h-11 w-11 items-center justify-center"
              >
                <Text className="text-[32px] leading-10 text-ink-light dark:text-ink-dark">
                  ‹
                </Text>
              </Pressable>
            </View>
            {saveError ? (
              <View className="px-6">
                <InfoCard variant="attention">
                  <Text className="text-[12px] text-[#87530C] dark:text-[#F1C879]">
                    {saveError}
                  </Text>
                </InfoCard>
              </View>
            ) : null}
            <ManualGoalScreen
              currentTarget={previewResult.target}
              sex={form.sex}
              onSave={(kcal) => void handleManualSave(kcal)}
              onCancel={() => setShowManual(false)}
              isSaving={isSaving}
            />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
        <View className="mx-auto w-full max-w-[560px] flex-1 px-6">
          <View className="min-h-[58px] flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour aux réglages"
              onPress={handleBack}
              className="h-11 w-11 items-center justify-center"
            >
              <Text className="text-[32px] leading-10 text-ink-light dark:text-ink-dark">
                ‹
              </Text>
            </Pressable>
            <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
              Mon objectif
            </Text>
            <View className="w-11" />
          </View>
          {saveError ? (
            <InfoCard variant="attention">
              <Text className="text-[12px] text-[#87530C] dark:text-[#F1C879]">
                {saveError}
              </Text>
            </InfoCard>
          ) : null}
          <ResultScreen
            result={previewResult}
            profile={buildProfile()}
            onUse={() => void handleUseGoal()}
            onManualEdit={() => setShowManual(true)}
            isSaving={isSaving}
          />
        </View>
      </SafeAreaView>
    );
  }

  // --- Wizard (étapes 0-2) ---
  return (
    <SafeAreaView className="flex-1 bg-canvas-light dark:bg-canvas-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="mx-auto w-full max-w-[560px] flex-1">
          {/* En-tête */}
          <View className="min-h-[58px] flex-row items-center justify-between px-6">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={handleBack}
              className="h-11 w-11 items-center justify-center"
            >
              <Text className="text-[32px] leading-10 text-ink-light dark:text-ink-dark">
                ‹
              </Text>
            </Pressable>
            <Text className="text-[15px] font-bold text-ink-light dark:text-ink-dark">
              Ton objectif
            </Text>
            <View className="w-11" />
          </View>

          {/* Barre de progression */}
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Étape ${step + 1} sur ${STEPS.length}`}
            accessibilityValue={{ min: 0, max: STEPS.length, now: step + 1 }}
            className="flex-row gap-[6px] px-6 mb-4"
          >
            {STEPS.map((s, i) => (
              <View
                key={s}
                className={`h-[5px] flex-1 rounded-full ${
                  i <= step
                    ? "bg-brand-primary"
                    : "bg-selected-light dark:bg-selected-dark"
                }`}
              />
            ))}
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerClassName="px-6 pb-9"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Titre de l'étape */}
            <Text className="text-[24px] font-bold text-ink-light dark:text-ink-dark mb-1">
              {step === 0
                ? "Mes informations"
                : step === 1
                  ? "Mon niveau d'activité"
                  : "Mon objectif de poids"}
            </Text>
            <Text className="text-[13px] text-muted-light dark:text-muted-dark mb-5">
              {step === 0
                ? "Ces données restent sur votre appareil et ne sont jamais partagées."
                : step === 1
                  ? "Basé sur votre semaine habituelle."
                  : "L'ajustement se basera sur votre TDEE."}
            </Text>

            {step === 0 && (
              <StepBodyInfo
                form={form}
                onChange={updateForm}
                errors={fieldErrors}
              />
            )}
            {step === 1 && <StepActivity form={form} onChange={updateForm} />}
            {step === 2 && <StepGoal form={form} onChange={updateForm} />}

            {saveError ? (
              <InfoCard variant="attention">
                <Text className="text-[12px] text-[#87530C] dark:text-[#F1C879]">
                  {saveError}
                </Text>
              </InfoCard>
            ) : null}

            <View className="mt-6 gap-3">
              <FoodButton
                label={step === 2 ? "Calculer mon objectif →" : "Suivant →"}
                onPress={handleNext}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

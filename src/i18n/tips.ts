import type { AppLanguage } from "@/i18n";

const translations = {
  en: {
    "tips.data.title": "A little more tracking helps",
    "tips.data.message":
      "Keep recording your meals to receive useful weekly insights.",
    "tips.protein.title": "Protein intake is below your reference",
    "tips.protein.message":
      "You recorded about {{percent}}% less protein than your daily reference this week. Lentils, tofu, or yogurt are examples of protein-rich foods. Photo-based calorie values are estimates.",
    "tips.protein.metric": "protein",
    "tips.calories.over.title": "Calorie goal reached often",
    "tips.calories.over.message":
      "Your recorded intake was above your calorie goal on about {{days}} of 7 days. Photo-based calorie values are estimates.",
    "tips.calories.over.metric": "{{days}} / 7 days",
    "tips.calories.low.title": "Your recorded intake looks lower this week",
    "tips.calories.low.message":
      "On {{days}} tracked days, your recorded average was below 70% of your goal. Check whether your diary is complete and make sure you are eating enough for your needs.",
    "tips.calories.low.metric": "{{percent}}% of goal",
    "tips.water.low.title": "Water goal reached on a few days",
    "tips.water.low.message":
      "Your water goal was recorded as reached on {{days}} of 7 days. This is a tracking snapshot, not a health assessment.",
    "tips.water.low.metric": "{{days}} / 7 days",
    "tips.fiber.low.title": "Fiber entries are below the reference",
    "tips.fiber.low.message":
      "Your recorded fiber average was about {{percent}}% below the reference this week. Estimates and incomplete entries can affect this figure.",
    "tips.fiber.low.metric": "−{{percent}}% fiber",
    "tips.consistency.title": "Your diary has a short gap",
    "tips.consistency.message":
      "No meals were recorded for at least {{days}} days in a row. You can pick up tracking again whenever it suits you.",
    "tips.consistency.metric": "{{days}} days",
    "tips.breakfast.title": "Breakfast entries are missing",
    "tips.breakfast.message":
      "No breakfast was recorded on {{days}} of 7 tracked days. If you did eat breakfast, you can add it to your diary.",
    "tips.breakfast.metric": "{{days}} / 7 days",
    "tips.trend.up.title": "Recorded calories are trending up",
    "tips.trend.up.message":
      "Your average on tracked days was about {{percent}}% higher than the previous week. Photo-based calorie values are estimates.",
    "tips.trend.up.metric": "+{{percent}}%",
    "tips.trend.down.title": "Recorded calories are trending down",
    "tips.trend.down.message":
      "Your average on tracked days was about {{percent}}% lower than the previous week. Photo-based calorie values are estimates.",
    "tips.trend.down.metric": "−{{percent}}%",
    "tips.positive.streak.title": "A tracking milestone",
    "tips.positive.streak.message":
      "You have recorded meals for {{days}} days in a row. Thanks for keeping a helpful record.",
    "tips.positive.streak.metric": "{{days}} days",
    "tips.positive.protein.title": "Protein reference reached",
    "tips.positive.protein.message":
      "Your recorded protein reached its daily reference on every tracked day this week. These entries are estimates.",
    "tips.positive.protein.metric": "7 / 7 days",
    "tips.macros.title": "Macro balance snapshot",
    "tips.macros.message":
      "{{macro}} made up about {{percent}}% of recorded macro energy this week. This is an estimate based only on entries with macro values.",
    "tips.macros.metric": "{{percent}}% {{macro}}",
    "tips.action.addMeal": "Add a meal",
    "tips.action.viewDiary": "View your diary",
    "tips.ui.day": "Tip of the day",
    "tips.ui.week": "Tips for this week",
    "tips.ui.seeAll": "See all",
    "tips.ui.dismiss": "Dismiss tip",
    "tips.ui.empty":
      "No new tips right now. Keep logging meals to see new patterns.",
    "tips.ui.insufficient":
      "Keep recording your meals to receive tips. At least 3 tracked days are needed.",
    "tips.ui.disclaimer":
      "Indicative tips only; they do not replace advice from a healthcare professional.",
    "tips.ui.estimate":
      "Calories estimated from photos can vary with ingredients, preparation, and portion size.",
    "tips.ui.error": "Tips could not be updated. Please try again later.",
    "tips.ui.retry": "Try again",
    "tips.ui.loading": "Updating…",
    "tips.metric.protein": "protein",
    "tips.metric.calories": "calories",
    "tips.metric.water": "water",
    "tips.metric.fiber": "fiber",
    "tips.metric.breakfast": "breakfast",
    "tips.metric.carbohydrates": "carbohydrates",
    "tips.metric.fat": "fat",
    "tips.metric.macros": "macros",
    "tips.metric.days": "days",
  },
  fr: {
    "tips.data.title": "Encore un peu de suivi",
    "tips.data.message":
      "Continue à enregistrer tes repas pour recevoir des tendances utiles.",
    "tips.protein.title": "Apports en protéines sous le repère",
    "tips.protein.message":
      "Tu as noté environ {{percent}} % de protéines de moins que le repère quotidien cette semaine. Les lentilles, le tofu et les yaourts sont des exemples d’aliments riches en protéines. Les calories estimées par photo restent approximatives.",
    "tips.protein.metric": "protéines",
    "tips.calories.over.title": "Objectif calorique souvent dépassé",
    "tips.calories.over.message":
      "Les apports notés ont dépassé ton objectif environ {{days}} jours sur 7. Les calories estimées par photo restent approximatives.",
    "tips.calories.over.metric": "{{days}} / 7 jours",
    "tips.calories.low.title": "Apports notés plus faibles cette semaine",
    "tips.calories.low.message":
      "Sur {{days}} jours suivis, la moyenne notée était sous 70 % de ton objectif. Vérifie que le journal est complet et veille à manger suffisamment selon tes besoins.",
    "tips.calories.low.metric": "{{percent}} % de l’objectif",
    "tips.water.low.title": "Objectif d’eau atteint quelques jours",
    "tips.water.low.message":
      "Ton objectif d’eau a été noté comme atteint {{days}} jours sur 7. C’est un aperçu du suivi, pas une évaluation de santé.",
    "tips.water.low.metric": "{{days}} / 7 jours",
    "tips.fiber.low.title": "Fibres notées sous le repère",
    "tips.fiber.low.message":
      "La moyenne de fibres notée était environ {{percent}} % sous le repère cette semaine. Les estimations et les saisies incomplètes peuvent modifier ce chiffre.",
    "tips.fiber.low.metric": "−{{percent}} % fibres",
    "tips.consistency.title": "Une petite pause dans le journal",
    "tips.consistency.message":
      "Aucun repas n’a été noté pendant au moins {{days}} jours de suite. Tu peux reprendre le suivi quand cela te convient.",
    "tips.consistency.metric": "{{days}} jours",
    "tips.breakfast.title": "Petits-déjeuners non renseignés",
    "tips.breakfast.message":
      "Aucun petit-déjeuner n’a été noté {{days}} jours sur 7 jours suivis. Si tu en as pris un, tu peux l’ajouter au journal.",
    "tips.breakfast.metric": "{{days}} / 7 jours",
    "tips.trend.up.title": "Tendance à la hausse des calories notées",
    "tips.trend.up.message":
      "La moyenne des jours suivis était environ {{percent}} % plus élevée que la semaine précédente. Les calories estimées par photo restent approximatives.",
    "tips.trend.up.metric": "+{{percent}} %",
    "tips.trend.down.title": "Tendance à la baisse des calories notées",
    "tips.trend.down.message":
      "La moyenne des jours suivis était environ {{percent}} % plus faible que la semaine précédente. Les calories estimées par photo restent approximatives.",
    "tips.trend.down.metric": "−{{percent}} %",
    "tips.positive.streak.title": "Un cap de suivi atteint",
    "tips.positive.streak.message":
      "Tu as noté des repas {{days}} jours de suite. Merci de tenir ce repère utile.",
    "tips.positive.streak.metric": "{{days}} jours",
    "tips.positive.protein.title": "Repère protéines atteint",
    "tips.positive.protein.message":
      "Les protéines notées ont atteint le repère quotidien chaque jour suivi cette semaine. Ces valeurs restent des estimations.",
    "tips.positive.protein.metric": "7 / 7 jours",
    "tips.macros.title": "Aperçu de la répartition des macros",
    "tips.macros.message":
      "Les {{macro}} représentaient environ {{percent}} % de l’énergie des macros notées cette semaine. Ce calcul ne porte que sur les repas avec macros renseignées.",
    "tips.macros.metric": "{{percent}} % {{macro}}",
    "tips.action.addMeal": "Ajouter un repas",
    "tips.action.viewDiary": "Voir le journal",
    "tips.ui.day": "Conseil du jour",
    "tips.ui.week": "Conseils de la semaine",
    "tips.ui.seeAll": "Voir tout",
    "tips.ui.dismiss": "Masquer ce conseil",
    "tips.ui.empty":
      "Pas de nouveau conseil pour le moment. Continue à noter tes repas pour repérer des tendances.",
    "tips.ui.insufficient":
      "Continue à enregistrer tes repas pour recevoir des conseils. Il faut au moins 3 jours suivis.",
    "tips.ui.disclaimer":
      "Conseils indicatifs, ne remplacent pas l’avis d’un professionnel de santé.",
    "tips.ui.estimate":
      "Les calories estimées à partir des photos varient selon les ingrédients, la préparation et la portion.",
    "tips.ui.error":
      "Impossible d’actualiser les conseils. Réessaie plus tard.",
    "tips.ui.retry": "Réessayer",
    "tips.ui.loading": "Mise à jour…",
    "tips.metric.protein": "protéines",
    "tips.metric.calories": "calories",
    "tips.metric.water": "eau",
    "tips.metric.fiber": "fibres",
    "tips.metric.breakfast": "petit-déjeuner",
    "tips.metric.carbohydrates": "glucides",
    "tips.metric.fat": "lipides",
    "tips.metric.macros": "macronutriments",
    "tips.metric.days": "jours",
  },
} as const;

export type TipTextKey = keyof typeof translations.en;
export type TipTranslationParams = Record<string, string | number>;

export function translateTip(
  key: TipTextKey,
  language: AppLanguage,
  params: TipTranslationParams = {},
) {
  const template = translations[language][key];
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => {
    const value = params[name];
    if (value === undefined) return placeholder;
    if (typeof value === "string" && value in translations[language]) {
      return translations[language][value as TipTextKey];
    }
    return String(value);
  });
}

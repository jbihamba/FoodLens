export interface FoodAnalysis {
  foodName: string;
  description: string;
  estimatedCalories: number | null;
  portionSize: string | null;
  ingredients: string[];
  confidence: number | null;
  macros?: {
    protein: number | null;
    carbohydrates: number | null;
    fat: number | null;
  } | null;
}

export interface ScanSession {
  imageUri: string;
  imageBase64?: string;
  analysis: FoodAnalysis | null;
}

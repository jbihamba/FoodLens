export interface FoodAnalysis {
  foodName: string;
  description: string;
  estimatedCalories: number | null;
  portionSize: string | null;
  ingredients: string[];
  confidence: number | null;
}

export interface ScanSession {
  imageUri: string;
  analysis: FoodAnalysis;
}


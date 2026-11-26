import type { WorkoutDifficulty } from "@/types/workout";

export const DIFFICULTY_LABELS: Record<WorkoutDifficulty, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

const CATEGORY_TRANSLATIONS: Record<
  string,
  { name: string; description: string }
> = {
  legs: {
    name: "Jambes",
    description: "Force, stabilité et équilibre du bas du corps.",
  },
  chest: {
    name: "Poitrine",
    description: "Mouvements de poussée ciblés et contrôlés.",
  },
  back: {
    name: "Dos",
    description: "Posture, tirage et renforcement dorsal.",
  },
  arms: {
    name: "Bras",
    description: "Séances courtes pour biceps et triceps.",
  },
  shoulders: {
    name: "Épaules",
    description: "Contrôle et mobilité du haut du corps.",
  },
  abs: {
    name: "Abdominaux",
    description: "Gainage, stabilité du tronc et contrôle.",
  },
  glutes: {
    name: "Fessiers",
    description: "Activation et renforcement des hanches.",
  },
  calves: {
    name: "Pieds & Mollets",
    description: "Appuis solides et détente des chevilles.",
  },
  "full-body": {
    name: "Corps entier",
    description: "Séance complète et équilibrée pour tout le corps.",
  },
  cardio: {
    name: "Cardio",
    description: "Rythme dynamique sans matériel.",
  },
};

const PLAN_TRANSLATIONS: Record<string, { name: string; description: string }> =
  {
    "Leg strength basics": {
      name: "Bases des jambes",
      description: "Une fondation stable pour le bas du corps.",
    },
    "Chest foundations": {
      name: "Fondations poitrine",
      description: "Une séance simple axée sur la poussée.",
    },
    "Back & posture": {
      name: "Dos & posture",
      description: "Tirage contrôlé et maintien du buste.",
    },
    "Arm builder": {
      name: "Tonus des bras",
      description: "Travail ciblé du haut du corps.",
    },
    "Shoulder control": {
      name: "Contrôle des épaules",
      description: "Séance mesurée pour la stabilité.",
    },
    "Core control": {
      name: "Gainage & abdos",
      description: "Pratique courte et efficace du tronc.",
    },
    "Glute foundation": {
      name: "Activation fessiers",
      description: "Extension de hanche et travail des jambes.",
    },
    "Calf focus": {
      name: "Focus mollets & pieds",
      description: "Séance compacte pour le bas des jambes.",
    },
    "Full body express": {
      name: "Corps entier express",
      description: "Un enchaînement équilibré pour les journées chargées.",
    },
    "Cardio starter": {
      name: "Cardio découverte",
      description: "Bouger à son rythme sans équipement.",
    },
  };

const EXERCISE_TRANSLATIONS: Record<
  string,
  { name: string; description: string; muscles: string; equipment: string }
> = {
  "Bodyweight Squat": {
    name: "Squat au poids du corps",
    description: "Un squat contrôlé sans matériel.",
    muscles: "Quadriceps · Fessiers · Ischios",
    equipment: "Aucun",
  },
  "Push-up": {
    name: "Pompes",
    description: "Un mouvement classique de poussée horizontale.",
    muscles: "Poitrine · Triceps · Épaules",
    equipment: "Aucun",
  },
  "Bent-over Row": {
    name: "Rowing buste penché",
    description: "Un mouvement de tirage ciblant le dos.",
    muscles: "Haut du dos · Dorsaux · Biceps",
    equipment: "Haltère ou objet du quotidien",
  },
  "Reverse Lunge": {
    name: "Fente arrière",
    description: "Un mouvement unilatéral alterné tout en contrôle.",
    muscles: "Fessiers · Quadriceps · Ischios",
    equipment: "Aucun",
  },
  Plank: {
    name: "Planche (gainage)",
    description: "Un maintien statique pour stabiliser la sangle abdominale.",
    muscles: "Abdominaux · Épaules · Fessiers",
    equipment: "Aucun",
  },
  "Glute Bridge": {
    name: "Pont fessier",
    description: "Extension des hanches au sol.",
    muscles: "Fessiers · Ischios · Gainage",
    equipment: "Aucun",
  },
  "Calf Raise": {
    name: "Élévation des mollets",
    description: "Renforcement contrôlé des mollets et chevilles.",
    muscles: "Mollets · Chevilles",
    equipment: "Aucun",
  },
  "March in Place": {
    name: "Marche dynamique sur place",
    description: "Un mouvement cardio simple et rythmé.",
    muscles: "Fléchisseurs de hanche · Mollets · Cardio",
    equipment: "Aucun",
  },
  "Jumping Jack": {
    name: "Jumping Jacks",
    description: "Un exercice cardio léger pour tout le corps.",
    muscles: "Corps entier · Mollets · Épaules",
    equipment: "Aucun",
  },
  "Shoulder Press": {
    name: "Développé épaules",
    description: "Une poussée verticale maîtrisée.",
    muscles: "Épaules · Triceps · Haut de poitrine",
    equipment: "Haltère ou objet du quotidien",
  },
};

export function localizeCategory(slug: string, fallbackName: string, fallbackDescription: string) {
  return (
    CATEGORY_TRANSLATIONS[slug] ?? {
      name: fallbackName,
      description: fallbackDescription,
    }
  );
}

export function localizePlan(name: string, description: string) {
  return (
    PLAN_TRANSLATIONS[name] ?? {
      name,
      description,
    }
  );
}

export function localizeExercise(
  name: string,
  description: string,
  muscles: string,
  equipment: string | null,
) {
  const match = EXERCISE_TRANSLATIONS[name];
  if (match) return match;
  return {
    name,
    description,
    muscles,
    equipment: equipment && equipment !== "None" ? equipment : "Aucun",
  };
}

export function formatDurationMinutes(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
}

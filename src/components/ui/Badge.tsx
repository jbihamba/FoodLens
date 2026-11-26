import { View } from "react-native";

import { Text } from "@/components/LocalizedText";

export type BadgeTone =
  | "nutrition"
  | "fitness"
  | "neutral"
  | "success"
  | "warning";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

const bgClasses: Record<BadgeTone, string> = {
  nutrition: "bg-brand-secondary dark:bg-[#22362A]",
  fitness: "bg-fitness-softLight dark:bg-fitness-softDark",
  neutral: "bg-canvas-light dark:bg-canvas-dark",
  success: "bg-[#EAF5E8] dark:bg-[#1E3524]",
  warning: "bg-[#FFF6E7] dark:bg-[#382C1A]",
};

const textClasses: Record<BadgeTone, string> = {
  nutrition: "text-brand-primary dark:text-[#8CC0A0]",
  fitness: "text-fitness-primary dark:text-fitness-dark",
  neutral: "text-muted-light dark:text-muted-dark",
  success: "text-[#2F6B3B] dark:text-[#A7D5A9]",
  warning: "text-[#87530C] dark:text-[#F1C879]",
};

export function Badge({ label, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <View
      className={`self-start rounded-full px-3 py-1.5 ${bgClasses[tone]} ${className}`}
    >
      <Text className={`text-[11px] font-bold ${textClasses[tone]}`}>
        {label}
      </Text>
    </View>
  );
}

import { View } from "react-native";

import { Text } from "@/components/LocalizedText";

export function MacroRow({ label, value }: { label: string; value: number | null }) {
  return <View className="min-h-11 flex-row items-center justify-between"><Text className="text-sm text-muted-light dark:text-muted-dark">{label}</Text><Text className="font-bold text-ink-light dark:text-ink-dark">{value == null ? "—" : `${value} g`}</Text></View>;
}

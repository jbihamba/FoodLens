import { View } from "react-native";

export function ScanSkeleton({ className = "" }: { className?: string }) {
  return <View accessibilityLabel="Chargement" className={`rounded-[12px] bg-[#DCEBDD] dark:bg-[#314237] ${className}`} />;
}

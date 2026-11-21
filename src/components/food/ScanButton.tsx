import { View } from 'react-native';

import { Pressable, Text } from '@/components/LocalizedText';

interface ScanButtonProps {
  onPress: () => void;
  label?: string;
}

export function ScanButton({ onPress, label = 'Scanner un plat' }: ScanButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Ouvre la caméra pour photographier un repas"
      onPress={onPress}
      className="min-h-[60px] flex-row items-center justify-center gap-3 rounded-[20px] bg-brand-primary px-5 shadow-sm">
      <View className="h-[21px] w-[27px] items-center justify-center rounded-[6px] border-2 border-white">
        <View className="h-[9px] w-[9px] rounded-full border-2 border-white" />
        <View className="absolute -top-[5px] left-[5px] h-[4px] w-[8px] rounded-t-sm bg-white" />
      </View>
      <Text className="text-[16px] font-bold text-white">{label}</Text>
    </Pressable>
  );
}

export function ScanFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le scanner"
      accessibilityHint="Ouvre la caméra pour photographier un repas"
      onPress={onPress}
      className="h-[60px] w-[60px] items-center justify-center rounded-full border-[3px] border-canvas-light bg-brand-primary shadow-lg dark:border-canvas-dark">
      <View className="h-[23px] w-[29px] items-center justify-center rounded-[7px] border-2 border-white">
        <View className="h-[10px] w-[10px] rounded-full border-2 border-white" />
        <View className="absolute -top-[5px] left-[5px] h-[4px] w-[9px] rounded-t-sm bg-white" />
      </View>
    </Pressable>
  );
}

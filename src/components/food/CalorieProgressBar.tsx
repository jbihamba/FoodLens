import { View } from 'react-native';

export function CalorieProgressBar({ progress }: { progress: number }) {
  const visualProgress = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: visualProgress }}
      className="h-[9px] overflow-hidden rounded-full bg-selected-light dark:bg-selected-dark">
      <View
        className="h-full rounded-full bg-brand-primary dark:bg-[#A8C8B2]"
        style={{ width: `${visualProgress}%` }}
      />
    </View>
  );
}

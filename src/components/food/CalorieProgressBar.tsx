import { View } from 'react-native';

interface CalorieProgressBarProps {
  progress: number;
  isGoalReached: boolean;
}

export function CalorieProgressBar({ progress, isGoalReached }: CalorieProgressBarProps) {
  const visualProgress = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={isGoalReached ? 'Daily calorie goal reached' : 'Daily calorie progress'}
      accessibilityValue={{ min: 0, max: 100, now: visualProgress }}
      className={`h-[9px] overflow-hidden rounded-full ${
        isGoalReached ? 'bg-[#F4DFDC] dark:bg-[#56332F]' : 'bg-selected-light dark:bg-selected-dark'
      }`}>
      <View
        className={`h-full rounded-full ${
          isGoalReached ? 'bg-[#C65346]' : 'bg-brand-primary dark:bg-[#A8C8B2]'
        }`}
        style={{ width: `${visualProgress}%` }}
      />
    </View>
  );
}

import { Pressable, Text, View, type PressableProps } from 'react-native';

type FoodButtonProps = Omit<PressableProps, 'style' | 'className'> & {
  label: string;
  hint?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  trailing?: string;
  className?: string;
};

const variantClasses = {
  primary: 'bg-brand-primary',
  secondary: 'bg-brand-secondary',
  outline: 'border border-brand-border bg-transparent',
} as const;

export function FoodButton({
  label,
  hint,
  variant = 'primary',
  trailing,
  disabled,
  className,
  ...props
}: FoodButtonProps) {
  const isPrimary = variant === 'primary';
  const textClassName = isPrimary ? 'text-white' : 'text-brand-primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`min-h-[58px] flex-row items-center justify-between gap-3 rounded-[18px] px-5 py-[14px] active:scale-[0.99] active:opacity-[0.86] disabled:opacity-[0.55] ${variantClasses[variant]} ${className ?? ''}`}
      {...props}>
      <View className="flex-1 gap-[2px]">
        <Text className={`text-base font-bold leading-[21px] ${textClassName}`}>{label}</Text>
        {hint ? (
          <Text
            className={`text-xs leading-[17px] ${
              isPrimary ? 'text-[#DCEBDD]' : 'text-[#52705D]'
            }`}>
            {hint}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text aria-hidden className={`text-xl font-semibold ${textClassName}`}>
          {trailing}
        </Text>
      ) : null}
    </Pressable>
  );
}

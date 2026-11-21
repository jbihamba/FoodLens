import { View } from "react-native";

const sizeClasses = {
  44: {
    mark: "h-11 w-11",
    plate: "h-[25.5px] w-[25.5px]",
    center: "h-[13.5px] w-[13.5px]",
  },
  34: {
    mark: "h-[34px] w-[34px]",
    plate: "h-[19.7px] w-[19.7px]",
    center: "h-[10.5px] w-[10.5px]",
  },
  28: {
    mark: "h-7 w-7",
    plate: "h-[16.2px] w-[16.2px]",
    center: "h-[8.7px] w-[8.7px]",
  },
  26: {
    mark: "h-[26px] w-[26px]",
    plate: "h-[15.1px] w-[15.1px]",
    center: "h-[8.1px] w-[8.1px]",
  },
} as const;

export function BrandMark({ size = 44 }: { size?: keyof typeof sizeClasses }) {
  const classes = sizeClasses[size];

  return (
    <View
      accessibilityLabel="FoodLens"
      className={`items-center justify-center rounded-full bg-brand-primary ${classes.mark}`}
    >
      <View
        className={`items-center justify-center rounded-full border-[1.5px] border-[#B9D2C2] ${classes.plate}`}
      >
        <View
          className={`rounded-full border-[1.5px] border-[#B9D2C2] ${classes.center}`}
        />
      </View>
    </View>
  );
}

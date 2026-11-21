import { SymbolView } from "expo-symbols";
import { Image } from "expo-image";
import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

export const StyledImage = cssInterop(Image, { className: "style" });
export const StyledAnimatedView = cssInterop(Animated.View, {
  className: "style",
});
export const StyledSymbolView = cssInterop(SymbolView, {
  className: {
    target: "style",
    nativeStyleToProp: { color: "tintColor" },
  },
});

import { Children, forwardRef, type ComponentRef } from "react";
import {
  Pressable as NativePressable,
  Text as NativeText,
  TextInput as NativeTextInput,
  type PressableProps,
  type TextInputProps,
  type TextProps,
} from "react-native";

import { translateText } from "@/i18n";
import { useAppSettings } from "@/stores/app-settings";

export function Text({ children, accessibilityLabel, ...props }: TextProps) {
  const { settings } = useAppSettings();
  return (
    <NativeText
      {...props}
      accessibilityLabel={
        accessibilityLabel
          ? translateText(accessibilityLabel, settings.language)
          : accessibilityLabel
      }
    >
      {Children.map(children, (child) =>
        typeof child === "string"
          ? translateText(child, settings.language)
          : child,
      )}
    </NativeText>
  );
}

export const Pressable = forwardRef<
  ComponentRef<typeof NativePressable>,
  PressableProps
>(function LocalizedPressable(
  { accessibilityLabel, accessibilityHint, ...props },
  ref,
) {
  const { settings } = useAppSettings();
  return (
    <NativePressable
      {...props}
      ref={ref}
      accessibilityLabel={
        accessibilityLabel
          ? translateText(accessibilityLabel, settings.language)
          : accessibilityLabel
      }
      accessibilityHint={
        accessibilityHint
          ? translateText(accessibilityHint, settings.language)
          : accessibilityHint
      }
    />
  );
});

export function TextInput({
  placeholder,
  accessibilityLabel,
  ...props
}: TextInputProps) {
  const { settings } = useAppSettings();
  return (
    <NativeTextInput
      {...props}
      accessibilityLabel={
        accessibilityLabel
          ? translateText(accessibilityLabel, settings.language)
          : accessibilityLabel
      }
      placeholder={
        placeholder
          ? translateText(placeholder, settings.language)
          : placeholder
      }
    />
  );
}

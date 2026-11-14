import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = Omit<ViewProps, 'style' | 'className'> & {
  type?: 'background' | 'backgroundElement' | 'backgroundSelected';
  className?: string;
};

const typeClasses = {
  background: 'bg-canvas-light dark:bg-canvas-dark',
  backgroundElement: 'bg-surface-light dark:bg-surface-dark',
  backgroundSelected: 'bg-selected-light dark:bg-selected-dark',
} as const;

export function ThemedView({ className, type = 'background', ...otherProps }: ThemedViewProps) {
  return <View className={`${typeClasses[type]} ${className ?? ''}`} {...otherProps} />;
}

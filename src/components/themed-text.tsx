import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = Omit<TextProps, 'style' | 'className'> & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: 'text' | 'textSecondary';
  className?: string;
};

const typeClasses = {
  small: 'text-sm leading-5 font-medium',
  smallBold: 'text-sm leading-5 font-bold',
  default: 'text-base leading-6 font-medium',
  title: 'text-5xl font-semibold leading-[52px]',
  subtitle: 'text-[32px] leading-[44px] font-semibold',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-[#3c87f7]',
  code: 'font-mono text-xs font-medium',
} as const;

const colorClasses = {
  text: 'text-ink-light dark:text-ink-dark',
  textSecondary: 'text-muted-light dark:text-muted-dark',
} as const;

export function ThemedText({
  className,
  type = 'default',
  themeColor = 'text',
  ...rest
}: ThemedTextProps) {
  const colorClassName =
    type === 'linkPrimary' ? '' : colorClasses[themeColor];

  return (
    <Text className={`${typeClasses[type]} ${colorClassName} ${className ?? ''}`} {...rest} />
  );
}

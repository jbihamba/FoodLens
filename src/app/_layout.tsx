import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { ScanSessionProvider } from '@/stores/scan-session';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ScanSessionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Colors[colorScheme === 'dark' ? 'dark' : 'light'].background,
          },
        }}
      />
    </ScanSessionProvider>
  );
}

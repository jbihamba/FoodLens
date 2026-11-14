import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { ScanSessionProvider } from '@/stores/scan-session';

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    if (Platform.OS === 'web' && systemColorScheme) {
      setColorScheme(systemColorScheme);
    }
  }, [setColorScheme, systemColorScheme]);

  return (
    <ScanSessionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ScanSessionProvider>
  );
}

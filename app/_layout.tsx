import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const backgroundColor = colorScheme === 'dark' ? '#000000' : '#ffffff';
    SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [colorScheme]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

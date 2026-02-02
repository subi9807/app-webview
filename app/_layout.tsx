import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          header: () => (
            <View
              style={{
                height: 60,
                backgroundColor: isDark ? '#000' : '#fff',
              }}
            />
          ),
        }}
      />
    </>
  );
}

import { Stack } from 'expo-router';

import { StudyProvider } from '@/context/StudyContext';

export default function RootLayout() {
  return (
    <StudyProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="artigo/[id]" />
        <Stack.Screen name="recurso/[id]" />
        <Stack.Screen name="pesquisa-profunda" />
      </Stack>
    </StudyProvider>
  );
}

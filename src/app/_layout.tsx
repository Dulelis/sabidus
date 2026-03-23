import { Stack } from 'expo-router';

import { AppUpdateProvider } from '@/context/AppUpdateContext';
import { StudyProvider } from '@/context/StudyContext';

export default function RootLayout() {
  return (
    <AppUpdateProvider>
      <StudyProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="artigo/[id]" />
          <Stack.Screen name="recurso/[id]" />
          <Stack.Screen name="pesquisa-profunda" />
        </Stack>
      </StudyProvider>
    </AppUpdateProvider>
  );
}

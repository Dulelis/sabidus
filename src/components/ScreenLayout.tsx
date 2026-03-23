import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

import { AppUpdateBanner } from './AppUpdateBanner';
import { Header } from './Header';
import { styles } from '../styles/appStyles';

export function ScreenLayout({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <AppUpdateBanner />
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

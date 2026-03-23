import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

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
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

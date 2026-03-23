import { Text, TouchableOpacity, View } from 'react-native';

import { useAppUpdate } from '@/context/AppUpdateContext';
import { styles } from '@/styles/appStyles';

export function AppUpdateBanner() {
  const { availableUpdate, dismissUpdate } = useAppUpdate();

  if (!availableUpdate) {
    return null;
  }

  const update = availableUpdate;

  return (
    <View style={styles.updateCard}>
      <Text style={styles.updateBadge}>Nova versao</Text>
      <Text style={styles.updateTitle}>Ha uma atualizacao do app disponivel</Text>
      <Text style={styles.updateText}>
        Versao atual: {update.currentVersion} | Nova versao: {update.latestVersion}
      </Text>
      <Text style={styles.updateText}>
        Quando quiser atualizar, gere e instale o APK mais recente por cima da versao atual
        neste aparelho Android.
      </Text>
      {update.releaseNotes ? (
        <Text style={styles.updateText}>{update.releaseNotes}</Text>
      ) : null}
      <View style={styles.updateActions}>
        <TouchableOpacity style={styles.updateDismissButton} onPress={dismissUpdate}>
          <Text style={styles.updateDismissButtonText}>Agora nao</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

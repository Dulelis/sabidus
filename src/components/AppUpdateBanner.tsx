import { Linking, Text, TouchableOpacity, View } from 'react-native';

import { useAppUpdate } from '@/context/AppUpdateContext';
import { styles } from '@/styles/appStyles';

export function AppUpdateBanner() {
  const { availableUpdate, dismissUpdate } = useAppUpdate();

  if (!availableUpdate) {
    return null;
  }

  const update = availableUpdate;

  async function handleOpenDownload() {
    if (!update.downloadUrl) {
      return;
    }

    await Linking.openURL(update.downloadUrl);
  }

  return (
    <View style={styles.updateCard}>
      <Text style={styles.updateBadge}>Nova versao</Text>
      <Text style={styles.updateTitle}>Ha uma atualizacao do app disponivel</Text>
      <Text style={styles.updateText}>
        Versao atual: {update.currentVersion} | Nova versao: {update.latestVersion}
      </Text>
      <Text style={styles.updateText}>
        Instale o APK mais recente para atualizar o app. No aparelho, basta aceitar a
        atualizacao por cima da versao atual.
      </Text>
      {update.releaseNotes ? (
        <Text style={styles.updateText}>{update.releaseNotes}</Text>
      ) : null}
      <View style={styles.updateActions}>
        {update.downloadUrl ? (
          <TouchableOpacity style={styles.updatePrimaryButton} onPress={handleOpenDownload}>
            <Text style={styles.updatePrimaryButtonText}>Abrir link do APK</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.updateDismissButton} onPress={dismissUpdate}>
          <Text style={styles.updateDismissButtonText}>Agora nao</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

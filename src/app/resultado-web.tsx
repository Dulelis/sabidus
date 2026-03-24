import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ScreenLayout } from '@/components/ScreenLayout';
import { useStudy } from '@/context/StudyContext';
import { printStudyContent, shareStudyContent } from '@/lib/contentActions';
import {
  buildMaterialLabelFromLink,
  inferMaterialKindFromUrl,
  normalizeMaterialUrlInput,
  openStudyMaterialUrl,
} from '@/lib/studyMaterials';
import { styles } from '@/styles/appStyles';

export default function WebResultRoute() {
  const params = useLocalSearchParams<{
    title?: string;
    url?: string;
    snippet?: string;
    domain?: string;
    badge?: string;
    theme?: string;
    course?: string;
  }>();
  const { addStudyMaterial } = useStudy();
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const title = (params.title ?? '').trim();
  const url = (params.url ?? '').trim();
  const snippet = (params.snippet ?? '').trim();
  const domain = (params.domain ?? '').trim();
  const badge = (params.badge ?? 'Resultado web').trim();
  const theme = (params.theme ?? '').trim();
  const course = (params.course ?? '').trim();

  if (!title || !url) {
    return (
      <ScreenLayout>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Resultado nao encontrado</Text>
          <Text style={styles.emptyText}>
            O item que voce tentou abrir nao trouxe dados suficientes para leitura.
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  function handleSave() {
    const normalizedUrl = normalizeMaterialUrlInput(url);
    const createdMaterial = addStudyMaterial({
      title: title || buildMaterialLabelFromLink(normalizedUrl),
      kind: inferMaterialKindFromUrl(normalizedUrl),
      url: normalizedUrl,
      mimeType: 'text/html',
      storageMode: 'persisted',
    });

    if (!createdMaterial) {
      setFeedbackMessage('Esse material ja esta salvo ou o link esta incompleto.');
      return;
    }

    setFeedbackMessage(`Material "${createdMaterial.title}" salvo na biblioteca.`);
  }

  return (
    <ScreenLayout>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.detailHero}>
        <Text style={styles.articleCategory}>{badge}</Text>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailDescription}>
          {domain || url}
        </Text>
        {theme ? (
          <View style={styles.articleMetaPill}>
            <Text style={styles.articleMetaText}>Tema: {theme}</Text>
          </View>
        ) : null}
        {course ? (
          <View style={styles.articleMetaPill}>
            <Text style={styles.articleMetaText}>Curso: {course}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.detailActions}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            void openStudyMaterialUrl(url).catch((error) => {
              setFeedbackMessage(
                error instanceof Error
                  ? error.message
                  : 'Nao foi possivel abrir a origem deste resultado.'
              );
            });
          }}
        >
          <Text style={styles.searchButtonText}>Abrir origem</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSave}>
          <Text style={styles.secondaryButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            void shareStudyContent({
              title,
              message: [snippet, url].filter(Boolean).join('\n\n'),
            });
          }}
        >
          <Text style={styles.secondaryButtonText}>Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            void printStudyContent({
              title,
              subtitle: [domain, course ? `Curso: ${course}` : ''].filter(Boolean).join(' | '),
              body: [snippet, url],
            });
          }}
        >
          <Text style={styles.secondaryButtonText}>Imprimir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailBodyCard}>
        <Text style={styles.sectionTitle}>Leitura inicial do resultado</Text>
        <Text style={styles.detailBodyText}>
          {snippet || 'Este resultado nao trouxe trecho legivel da fonte, mas a origem pode ser aberta pelo botao acima.'}
        </Text>
      </View>

      {feedbackMessage ? (
        <View style={styles.savedSummaryCard}>
          <Text style={styles.savedSummaryText}>{feedbackMessage}</Text>
        </View>
      ) : null}

      <View style={styles.savedSummaryCard}>
        <Text style={styles.savedSummaryText}>
          Este espaco mostra o trecho identificado pela pesquisa. Para ler o artigo completo, abra a
          origem no navegador ou no app que o Android usar para esse link.
        </Text>
      </View>
    </ScreenLayout>
  );
}

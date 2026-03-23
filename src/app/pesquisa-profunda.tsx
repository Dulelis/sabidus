import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import { ScreenLayout } from '@/components/ScreenLayout';
import { requestDeepSearch, type DeepSearchResponse } from '@/lib/apiClient';
import { styles } from '@/styles/appStyles';

export default function DeepSearchRoute() {
  const { theme = '' } = useLocalSearchParams<{ theme?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<DeepSearchResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDeepSearch() {
      const normalizedTheme = theme.trim();

      if (!normalizedTheme) {
        if (isMounted) {
          setErrorMessage('Informe um tema para iniciar a pesquisa aprofundada.');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await requestDeepSearch({ theme: normalizedTheme });

        if (!isMounted) {
          return;
        }

        setResult(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel concluir a pesquisa aprofundada.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDeepSearch();

    return () => {
      isMounted = false;
    };
  }, [theme]);

  return (
    <ScreenLayout>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.detailHero}>
        <Text style={styles.articleCategory}>Pesquisa aprofundada</Text>
        <Text style={styles.detailTitle}>{theme || 'Tema sem definicao'}</Text>
        <Text style={styles.detailDescription}>
          Links, dicas, videos e pistas de aprofundamento buscados na internet.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.detailBodyCard}>
          <Text style={styles.sectionTitle}>Buscando na internet</Text>
          <Text style={styles.detailBodyText}>
            Aguarde enquanto o app procura referencias, dicas e materiais atualizados.
          </Text>
        </View>
      ) : null}

      {!isLoading && errorMessage ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Pesquisa indisponivel</Text>
          <Text style={styles.emptyText}>{errorMessage}</Text>
        </View>
      ) : null}

      {!isLoading && result ? (
        <>
          <View style={styles.detailBodyCard}>
            <Text style={styles.sectionTitle}>Resumo web</Text>
            <Text style={styles.detailBodyText}>{result.summary}</Text>
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Dicas praticas</Text>
            {result.tips.map((tip) => (
              <Text key={tip} style={styles.helperBullet}>
                - {tip}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proximos passos</Text>
            {result.nextSteps.map((step) => (
              <View key={step} style={styles.articleCard}>
                <Text style={styles.articleDescription}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links encontrados</Text>
            {result.sources.map((source) => (
              <TouchableOpacity
                key={source.url}
                style={styles.sourceItem}
                onPress={() => Linking.openURL(source.url)}
              >
                <Text style={styles.sourceName}>{source.title}</Text>
                <Text style={styles.sourceType}>{source.url}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Videos relacionados</Text>
            {result.videos.length > 0 ? (
              result.videos.map((video) => (
                <TouchableOpacity
                  key={video.url}
                  style={styles.sourceItem}
                  onPress={() => Linking.openURL(video.url)}
                >
                  <Text style={styles.sourceName}>{video.title}</Text>
                  <Text style={styles.sourceType}>{video.url}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhum video destacado</Text>
                <Text style={styles.emptyText}>
                  Tente outro termo relacionado ou consulte os links encontrados acima.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consultas feitas na web</Text>
            {result.webSearchQueries.map((item) => (
              <View key={item} style={styles.toolItem}>
                <Text style={styles.toolText}>{item}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScreenLayout>
  );
}

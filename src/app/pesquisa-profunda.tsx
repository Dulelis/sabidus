import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ScreenLayout } from '@/components/ScreenLayout';
import { useStudy } from '@/context/StudyContext';
import { requestDeepSearch, type DeepSearchResponse } from '@/lib/apiClient';
import {
  getDiscoveryProfile,
  parseDiscoveryFilters,
} from '@/lib/discoveryProfiles';
import {
  buildMaterialLabelFromLink,
  inferMaterialKindFromUrl,
  normalizeMaterialUrlInput,
  openStudyMaterialUrl,
} from '@/lib/studyMaterials';
import { styles } from '@/styles/appStyles';
import type { StudyMaterial } from '@/types/app';

export default function DeepSearchRoute() {
  const { theme = '', course = '', mode = 'general', filters } = useLocalSearchParams<{
    theme?: string;
    course?: string;
    mode?: string;
    filters?: string | string[];
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<DeepSearchResponse | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const { addStudyMaterial } = useStudy();
  const discoveryProfile = getDiscoveryProfile(mode);
  const selectedFilters = useMemo(() => parseDiscoveryFilters(filters), [filters]);

  useEffect(() => {
    let isMounted = true;

    async function loadDeepSearch() {
      const normalizedTheme = theme.trim();
      const normalizedCourse = course.trim();

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
        const response = await requestDeepSearch({
          theme: normalizedTheme,
          course: normalizedCourse || undefined,
          mode,
          filters: selectedFilters,
        });

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
  }, [course, filters, mode, selectedFilters, theme]);

  function handleSaveExternalMaterial(item: {
    kind?: StudyMaterial['kind'];
    title: string;
    url: string;
  }) {
    const normalizedUrl = normalizeMaterialUrlInput(item.url);
    const resolvedKind = item.kind || inferMaterialKindFromUrl(normalizedUrl);
    const createdMaterial = addStudyMaterial({
      title: item.title.trim() || buildMaterialLabelFromLink(normalizedUrl),
      kind: resolvedKind,
      url: normalizedUrl,
      mimeType: resolvedKind === 'arquivo-externo' ? 'application/octet-stream' : 'text/html',
      storageMode: 'persisted',
    });

    if (!createdMaterial) {
      setFeedbackMessage('Esse material ja esta salvo ou o link informado esta incompleto.');
      return;
    }

    setFeedbackMessage(`Material "${createdMaterial.title}" salvo na biblioteca do app.`);
  }

  function openWebResult(item: {
    badge: string;
    domain: string;
    snippet: string;
    title: string;
    url: string;
  }) {
    router.push({
      pathname: '/resultado-web' as never,
      params: {
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        domain: item.domain,
        badge: item.badge,
        theme: theme.trim(),
        course: course.trim(),
      },
    } as never);
  }

  return (
    <ScreenLayout>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.detailHero}>
        <Text style={styles.articleCategory}>{discoveryProfile.label}</Text>
        <Text style={styles.detailTitle}>{theme || 'Tema sem definicao'}</Text>
        <Text style={styles.detailDescription}>
          {course
            ? `Recorte orientado para ${course}. ${discoveryProfile.summary}`
            : discoveryProfile.summary}
        </Text>
        {selectedFilters.length > 0 ? (
          <View style={styles.chipRow}>
            {selectedFilters.map((filterId: string) => {
              const filterLabel =
                discoveryProfile.filters.find((item) => item.id === filterId)?.label || filterId;

              return (
                <View key={filterId} style={styles.articleMetaPill}>
                  <Text style={styles.articleMetaText}>{filterLabel}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      {feedbackMessage ? (
        <View style={styles.savedSummaryCard}>
          <Text style={styles.savedSummaryText}>{feedbackMessage}</Text>
        </View>
      ) : null}

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
            {result.whyItMatters ? (
              <Text style={styles.detailBodyText}>{result.whyItMatters}</Text>
            ) : null}
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Topicos-chave</Text>
            {result.keyTopics.map((topic) => (
              <Text key={topic} style={styles.helperBullet}>
                - {topic}
              </Text>
            ))}
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Aplicacoes praticas</Text>
            {result.practicalApplications.map((item) => (
              <Text key={item} style={styles.helperBullet}>
                - {item}
              </Text>
            ))}
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
            <Text style={styles.sectionTitle}>Perguntas para guiar a pesquisa</Text>
            {result.studyQuestions.map((questionItem) => (
              <View key={questionItem} style={styles.toolItem}>
                <Text style={styles.toolText}>{questionItem}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{discoveryProfile.sourcesTitle}</Text>
            {result.sources.map((source) => (
              <View key={source.url} style={styles.sourceItem}>
                <Text style={styles.sourceName}>{source.title}</Text>
                <Text style={styles.sourceType}>{source.domain || source.url}</Text>
                <Text style={styles.sourceSnippet}>{source.snippet}</Text>
                <View style={styles.itemActionRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.compactControlButton]}
                    onPress={() =>
                      openWebResult({
                        badge:
                          mode === 'scientific-articles'
                            ? 'Artigo web'
                            : mode === 'academic-research'
                              ? 'Pesquisa web'
                              : 'Fonte web',
                        domain: source.domain,
                        snippet: source.snippet,
                        title: source.title,
                        url: source.url,
                      })
                    }
                  >
                    <Text style={styles.secondaryButtonText}>Ler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.compactControlButton]}
                    onPress={() => {
                      void openStudyMaterialUrl(source.url).catch((error) => {
                        setFeedbackMessage(
                          error instanceof Error
                            ? error.message
                            : 'Nao foi possivel abrir esse link agora.'
                        );
                      });
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Origem</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.searchButton, styles.compactControlButton]}
                    onPress={() =>
                      handleSaveExternalMaterial({
                        title: source.title,
                        url: source.url,
                      })
                    }
                  >
                    <Text style={styles.searchButtonText}>Gravar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{discoveryProfile.videosTitle}</Text>
            {result.videos.length > 0 ? (
              result.videos.map((video) => (
                <View key={video.url} style={styles.sourceItem}>
                  <Text style={styles.sourceName}>{video.title}</Text>
                  <Text style={styles.sourceType}>{video.domain || video.url}</Text>
                  <Text style={styles.sourceSnippet}>{video.snippet}</Text>
                  <View style={styles.itemActionRow}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.compactControlButton]}
                      onPress={() =>
                        openWebResult({
                          badge: 'Video web',
                          domain: video.domain,
                          snippet: video.snippet,
                          title: video.title,
                          url: video.url,
                        })
                      }
                    >
                      <Text style={styles.secondaryButtonText}>Ler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.compactControlButton]}
                      onPress={() => {
                        void openStudyMaterialUrl(video.url).catch((error) => {
                          setFeedbackMessage(
                            error instanceof Error
                              ? error.message
                              : 'Nao foi possivel abrir esse video agora.'
                          );
                        });
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>Origem</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.searchButton, styles.compactControlButton]}
                      onPress={() =>
                        handleSaveExternalMaterial({
                          kind: 'link',
                          title: video.title,
                          url: video.url,
                        })
                      }
                    >
                      <Text style={styles.searchButtonText}>Gravar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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

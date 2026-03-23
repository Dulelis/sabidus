import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { printStudyContent, shareStudyContent } from '../lib/contentActions';
import { useStudy } from '../context/StudyContext';
import { researchSources } from '../data/mockData';
import type { DeepSearchResponse } from '../lib/apiClient';
import type { DiscoveryProfile } from '../lib/discoveryProfiles';
import {
  buildMaterialLabelFromLink,
  inferMaterialKindFromUrl,
  normalizeMaterialUrlInput,
  openStudyMaterialUrl,
} from '../lib/studyMaterials';
import { styles } from '../styles/appStyles';
import type {
  Article,
  BookSuggestion,
  DiscoveryMode,
  ResourceModule,
  StudyMaterial,
  UnifiedSearchResult,
  VideoLesson,
} from '../types/app';

type SearchScreenProps = {
  appliedQuery: string;
  appliedMode: DiscoveryMode;
  appliedFilters: string[];
  appliedDiscoveryProfile: DiscoveryProfile;
  clearFilters: () => void;
  discoveryMode: DiscoveryMode;
  discoveryProfile: DiscoveryProfile;
  filteredArticles: Article[];
  hasPendingSearch: boolean;
  isThemeInsightLoading: boolean;
  relatedBooks: BookSuggestion[];
  relatedCourseLabel: string;
  relatedResources: ResourceModule[];
  relatedVideos: VideoLesson[];
  selectedFilters: string[];
  setDiscoveryMode: (value: DiscoveryMode) => void;
  toggleFilter: (filterId: string) => void;
  themeInsight: DeepSearchResponse | null;
  themeInsightError: string;
  unifiedResults: UnifiedSearchResult[];
  query: string;
  setQuery: (value: string) => void;
  selectedCourse: string;
  setSelectedCourse: (value: string) => void;
};

export function SearchScreen({
  appliedQuery,
  appliedMode,
  appliedFilters,
  appliedDiscoveryProfile,
  clearFilters,
  discoveryMode,
  discoveryProfile,
  filteredArticles,
  hasPendingSearch,
  isThemeInsightLoading,
  relatedBooks,
  relatedCourseLabel,
  relatedResources,
  relatedVideos,
  selectedFilters,
  setDiscoveryMode,
  toggleFilter,
  themeInsight,
  themeInsightError,
  unifiedResults,
  query,
  setQuery,
  selectedCourse,
  setSelectedCourse,
}: SearchScreenProps) {
  const {
    addStudyMaterial,
    addCourse,
    clearRecentSearches,
    courseCatalog,
    courseKnowledge,
    deleteCourse,
    openSearchTheme,
    recentSearches,
    registerSearch,
    updateCourse,
  } = useStudy();
  const [courseSearch, setCourseSearch] = useState('');
  const [materialFeedback, setMaterialFeedback] = useState('');

  const visibleCourses = useMemo(() => {
    const normalizedCourseSearch = courseSearch.trim().toLowerCase();

    if (!normalizedCourseSearch) {
      return courseCatalog;
    }

    return courseCatalog.filter((course) =>
      course.label.toLowerCase().includes(normalizedCourseSearch)
    );
  }, [courseCatalog, courseSearch]);

  const selectedCourseLabel =
    selectedCourse === 'todos'
      ? ''
      : courseCatalog.find((course) => course.id === selectedCourse)?.label || '';
  const selectedCourseKnowledge = courseKnowledge.find(
    (item) =>
      item.courseId === selectedCourse ||
      item.courseLabel.toLowerCase() === selectedCourseLabel.toLowerCase()
  );

  function handleSaveSearch() {
    if (!query.trim()) {
      return;
    }

    registerSearch(query);
    setMaterialFeedback(`Busca "${query.trim()}" salva para reaplicar depois.`);
  }

  function handleApplySearch() {
    if (!query.trim()) {
      return;
    }

    openSearchTheme({
      query,
      course: selectedCourse,
      mode: discoveryMode,
      filters: selectedFilters,
    });

    router.replace('/pesquisar');
  }

  function handleAddCourse() {
    const createdCourse = addCourse(courseSearch);

    if (!createdCourse) {
      return;
    }

    setSelectedCourse(createdCourse.id);
    setCourseSearch(createdCourse.label);
  }

  function handleEditCourse() {
    if (selectedCourse === 'todos') {
      return;
    }

    const updatedCourse = updateCourse(selectedCourse, courseSearch);

    if (!updatedCourse) {
      return;
    }

    setSelectedCourse(updatedCourse.id);
    setCourseSearch(updatedCourse.label);
  }

  function handleDeleteCourse() {
    if (selectedCourse === 'todos') {
      return;
    }

    deleteCourse(selectedCourse);
    setSelectedCourse('todos');
    setCourseSearch('');
  }

  function handleOpenDeepSearch() {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return;
    }

    openSearchTheme({
      query: normalizedQuery,
      course: selectedCourse,
      mode: discoveryMode,
      filters: selectedFilters,
    });

    const selectedCourseForSearch = selectedCourseLabel || relatedCourseLabel;
    const basePath = selectedCourseForSearch
      ? `/pesquisa-profunda?theme=${encodeURIComponent(normalizedQuery)}&course=${encodeURIComponent(
          selectedCourseForSearch
        )}`
      : `/pesquisa-profunda?theme=${encodeURIComponent(normalizedQuery)}`;
    const filtersParam = selectedFilters.join(',');
    const targetPath = `${basePath}&mode=${encodeURIComponent(discoveryMode)}${
      filtersParam ? `&filters=${encodeURIComponent(filtersParam)}` : ''
    }`;

    if (typeof window !== 'undefined') {
      window.open(targetPath, '_blank', 'noopener,noreferrer');
      return;
    }

    router.push({
      pathname: '/pesquisa-profunda',
      params: selectedCourseForSearch
        ? {
            theme: normalizedQuery,
            course: selectedCourseForSearch,
            mode: discoveryMode,
            filters: selectedFilters.join(','),
          }
        : { theme: normalizedQuery, mode: discoveryMode, filters: selectedFilters.join(',') },
    });
  }

  function openUnifiedResult(result: UnifiedSearchResult) {
    if (result.routeType === 'article' && result.routeId) {
      router.push(`/artigo/${result.routeId}`);
      return;
    }

    if (result.routeType === 'resource' && result.routeId) {
      if (result.routeParams?.id) {
        const resourceParams = result.routeParams as Record<string, string> & { id: string };

        router.push({
          pathname: '/recurso/[id]',
          params: resourceParams,
        });
        return;
      }

      router.push(`/recurso/${result.routeId}`);
      return;
    }

    if (result.routeType === 'tab' && result.routeId) {
      if (result.routeId === 'pesquisar') {
        router.push({
          pathname: '/pesquisar',
          params: result.routeParams,
        });
        return;
      }

      if (result.routeId === 'recursos') {
        router.push('/recursos');
        return;
      }

      if (result.routeId === 'conta') {
        router.push('/conta');
      }
    }

    if (result.routeType === 'external' && result.routeUrl) {
      void openStudyMaterialUrl(result.routeUrl).catch((error) => {
        setMaterialFeedback(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel abrir esse material agora.'
        );
      });
    }
  }

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
      setMaterialFeedback('Esse material ja esta salvo ou o link esta incompleto.');
      return;
    }

    setMaterialFeedback(`Material "${createdMaterial.title}" salvo na sua biblioteca.`);
  }

  function handleShareTheme() {
    if (!appliedQuery) {
      return;
    }

    const detail = themeInsight?.summary || `Pesquisa em ${appliedDiscoveryProfile.label}`;

    void shareStudyContent({
      title: appliedQuery,
      message: [detail, relatedCourseLabel ? `Curso relacionado: ${relatedCourseLabel}` : '']
        .filter(Boolean)
        .join('\n'),
    }).catch(() => {
      setMaterialFeedback('Nao foi possivel compartilhar esse tema agora.');
    });
  }

  function handlePrintTheme() {
    if (!appliedQuery) {
      return;
    }

    void printStudyContent({
      title: appliedQuery,
      subtitle: relatedCourseLabel ? `Curso relacionado: ${relatedCourseLabel}` : undefined,
      body: [
        themeInsight?.summary || 'Tema de estudo salvo no app.',
        themeInsight?.whyItMatters || '',
        themeInsight?.keyTopics.length
          ? `Topicos-chave: ${themeInsight.keyTopics.join('; ')}`
          : '',
        themeInsight?.studyQuestions.length
          ? `Perguntas: ${themeInsight.studyQuestions.join('; ')}`
          : '',
      ],
    }).catch(() => {
      setMaterialFeedback('Nao foi possivel abrir a impressao agora.');
    });
  }

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.screenTitle}>Pesquisar</Text>
        <Text style={styles.screenSubtitle}>
          {discoveryProfile.summary}
        </Text>
      </View>

      <View style={styles.searchPanel}>
        <TextInput
          placeholder="Digite um tema, materia ou palavra-chave"
          placeholderTextColor="#7D8597"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo de descoberta</Text>
        <View style={styles.chipRow}>
          {(
            [
              { value: 'general', label: 'Busca geral' },
              { value: 'scientific-articles', label: 'Artigos cientificos' },
              { value: 'academic-research', label: 'Pesquisas academicas' },
              { value: 'channels', label: 'Canais' },
              { value: 'work-models', label: 'Modelos' },
            ] as Array<{ value: DiscoveryMode; label: string }>
          ).map((item) => {
            const isActive = discoveryMode === item.value;

            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => {
                  setDiscoveryMode(item.value);
                  clearFilters();
                }}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {discoveryProfile.filters.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filtros</Text>
            {selectedFilters.length > 0 ? (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.sectionLink}>Limpar filtros</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.chipRow}>
            {discoveryProfile.filters.map((filter) => {
              const isActive = selectedFilters.includes(filter.id);

              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => toggleFilter(filter.id)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveSearch}>
        <Text style={styles.secondaryButtonText}>Salvar busca atual</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.searchButton} onPress={handleApplySearch}>
        <Text style={styles.searchButtonText}>Abrir tema pesquisado</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenDeepSearch}>
        <Text style={styles.secondaryButtonText}>Aprofundar na internet</Text>
      </TouchableOpacity>

      {materialFeedback ? (
        <View style={styles.savedSummaryCard}>
          <Text style={styles.savedSummaryText}>{materialFeedback}</Text>
        </View>
      ) : null}

      {hasPendingSearch ? (
        <View style={styles.detailBodyCard}>
          <Text style={styles.sectionTitle}>Busca pronta para aplicar</Text>
          <Text style={styles.detailBodyText}>
            O texto digitado, o modo selecionado ou os filtros ainda nao viraram a busca ativa.
            Toque em Abrir tema pesquisado para puxar a analise com o recorte escolhido.
          </Text>
        </View>
      ) : null}

      {appliedQuery ? (
        <View style={styles.detailHero}>
          <Text style={styles.articleCategory}>{appliedDiscoveryProfile.label}</Text>
          <Text style={styles.detailTitle}>{appliedQuery}</Text>
          <Text style={styles.detailDescription}>
            {relatedCourseLabel
              ? `Curso relacionado: ${relatedCourseLabel}. ${appliedDiscoveryProfile.summary}`
              : appliedDiscoveryProfile.summary}
          </Text>
          {appliedFilters.length > 0 ? (
            <View style={styles.chipRow}>
              {appliedFilters.map((filterId) => {
                const filterLabel =
                  appliedDiscoveryProfile.filters.find((item) => item.id === filterId)?.label ||
                  filterId;

                return (
                  <View key={filterId} style={styles.articleMetaPill}>
                    <Text style={styles.articleMetaText}>{filterLabel}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.searchButton, styles.controlButton]}
              onPress={handleSaveSearch}
            >
              <Text style={styles.searchButtonText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.controlButton]}
              onPress={handleShareTheme}
            >
              <Text style={styles.secondaryButtonText}>Compartilhar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.controlButton]}
              onPress={handlePrintTheme}
            >
              <Text style={styles.secondaryButtonText}>Imprimir</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {appliedQuery && isThemeInsightLoading ? (
        <View style={styles.detailBodyCard}>
          <Text style={styles.sectionTitle}>Analisando tema com IA</Text>
          <Text style={styles.detailBodyText}>
            Estou cruzando o tema com o curso selecionado e buscando referencias na web para
            entregar um panorama mais util.
          </Text>
        </View>
      ) : null}

      {appliedQuery && !isThemeInsightLoading && themeInsightError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Analise temporariamente indisponivel</Text>
          <Text style={styles.emptyText}>{themeInsightError}</Text>
        </View>
      ) : null}

      {appliedQuery && !isThemeInsightLoading && themeInsight ? (
        <>
          <View style={styles.detailBodyCard}>
            <Text style={styles.sectionTitle}>Panorama inicial</Text>
            <Text style={styles.detailBodyText}>{themeInsight.summary}</Text>
            {themeInsight.whyItMatters ? (
              <Text style={styles.detailBodyText}>{themeInsight.whyItMatters}</Text>
            ) : null}
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Topicos-chave do tema</Text>
            {themeInsight.keyTopics.map((topic) => (
              <Text key={topic} style={styles.helperBullet}>
                - {topic}
              </Text>
            ))}
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Aplicacoes praticas</Text>
            {themeInsight.practicalApplications.map((item) => (
              <Text key={item} style={styles.helperBullet}>
                - {item}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perguntas para orientar o estudo</Text>
            {themeInsight.studyQuestions.map((questionItem) => (
              <View key={questionItem} style={styles.toolItem}>
                <Text style={styles.toolText}>{questionItem}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consultas sugeridas na web</Text>
            {themeInsight.webSearchQueries.map((item) => (
              <View key={item} style={styles.toolItem}>
                <Text style={styles.toolText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{appliedDiscoveryProfile.sourcesTitle}</Text>
            {themeInsight.sources.length > 0 ? (
              themeInsight.sources.slice(0, 4).map((source) => (
                <View key={source.url} style={styles.sourceItem}>
                  <Text style={styles.sourceName}>{source.title}</Text>
                  <Text style={styles.sourceType}>{source.url}</Text>
                  <View style={styles.itemActionRow}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.compactControlButton]}
                      onPress={() => {
                        void openStudyMaterialUrl(source.url).catch((error) => {
                          setMaterialFeedback(
                            error instanceof Error
                              ? error.message
                              : 'Nao foi possivel abrir esse link agora.'
                          );
                        });
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>Abrir</Text>
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
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhuma fonte listada agora</Text>
                <Text style={styles.emptyText}>
                  Abra a pesquisa aprofundada para tentar um novo recorte ou variar os termos.
                </Text>
              </View>
            )}
          </View>

          {themeInsight.videos.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{appliedDiscoveryProfile.videosTitle}</Text>
              {themeInsight.videos.map((video) => (
                <View key={video.url} style={styles.sourceItem}>
                  <Text style={styles.sourceName}>{video.title}</Text>
                  <Text style={styles.sourceType}>{video.url}</Text>
                  <View style={styles.itemActionRow}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.compactControlButton]}
                      onPress={() => {
                        void openStudyMaterialUrl(video.url).catch((error) => {
                          setMaterialFeedback(
                            error instanceof Error
                              ? error.message
                              : 'Nao foi possivel abrir esse video agora.'
                          );
                        });
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>Abrir</Text>
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
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <TextInput
        placeholder="Procurar curso"
        placeholderTextColor="#7D8597"
        style={styles.searchInput}
        value={courseSearch}
        onChangeText={setCourseSearch}
      />

      <View style={styles.chipRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleAddCourse}>
          <Text style={styles.secondaryButtonText}>Adicionar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleEditCourse}>
          <Text style={styles.secondaryButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleDeleteCourse}>
          <Text style={styles.secondaryButtonText}>Apagar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chipRow}>
        {visibleCourses.map((course) => {
          const isActive = course.id === selectedCourse;

          return (
            <TouchableOpacity
              key={course.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setSelectedCourse(course.id)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {course.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {visibleCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum curso encontrado</Text>
            <Text style={styles.emptyText}>
              Ajuste a busca do curso para filtrar as areas disponiveis.
            </Text>
          </View>
        ) : null}
      </View>

      {selectedCourseKnowledge ? (
        <View style={styles.detailBodyCard}>
          <Text style={styles.sectionTitle}>
            Conhecimento de {selectedCourseKnowledge.courseLabel}
          </Text>
          <Text style={styles.detailBodyText}>{selectedCourseKnowledge.overview}</Text>
          {selectedCourseKnowledge.suggestedPaths.map((item) => (
            <Text key={item} style={styles.helperBullet}>
              - {item}
            </Text>
          ))}
        </View>
      ) : null}

      {appliedQuery ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tudo relacionado em {appliedDiscoveryProfile.label}</Text>
          <View style={styles.savedSummaryCard}>
            <Text style={styles.savedSummaryText}>
              {unifiedResults.length} resultados relacionados entre artigos, videos, metodos,
              formulas, ENEM, simulados, resumos, cursos e materiais salvos.
            </Text>
          </View>
          {unifiedResults.map((result) => (
            <TouchableOpacity
              key={result.id}
              style={styles.articleCard}
              onPress={() => openUnifiedResult(result)}
            >
              <Text style={styles.articleCategory}>{result.badge}</Text>
              <Text style={styles.articleTitle}>{result.title}</Text>
              <Text style={styles.articleDescription}>{result.description}</Text>
              <Text style={styles.toolText}>{result.subtitle}</Text>
            </TouchableOpacity>
          ))}
          {unifiedResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nada relacionado encontrado</Text>
              <Text style={styles.emptyText}>
                Tente variar o tema com menos palavras ou usar o nome da materia.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {appliedQuery ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explorar neste recorte</Text>
          {relatedCourseLabel ? (
            <View style={styles.savedSummaryCard}>
              <Text style={styles.savedSummaryText}>
                Curso relacionado: {relatedCourseLabel}
              </Text>
              <Text style={styles.savedSummaryText}>
                Materiais encontrados: {filteredArticles.length}
              </Text>
              <Text style={styles.savedSummaryText}>
                Recursos sugeridos: {relatedResources.length}
              </Text>
            </View>
          ) : null}

          {relatedResources.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              style={styles.articleCard}
              onPress={() => router.push(`/recurso/${resource.id}`)}
            >
              <Text style={styles.articleCategory}>{resource.status}</Text>
              <Text style={styles.articleTitle}>{resource.title}</Text>
              <Text style={styles.articleDescription}>{resource.summary}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {appliedMode === 'scientific-articles'
              ? 'Artigos relacionados'
              : appliedMode === 'academic-research'
                ? 'Pesquisas relacionadas'
                : appliedMode === 'channels'
                  ? 'Materiais para assistir'
                  : appliedMode === 'work-models'
                    ? 'Trabalhos e referencias'
                    : 'Resultados'}
          </Text>
          <Text style={styles.sectionLink}>{filteredArticles.length} itens</Text>
        </View>

        {filteredArticles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => router.push(`/artigo/${article.id}`)}
          >
            <Text style={styles.articleCategory}>{article.category}</Text>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleDescription}>{article.description}</Text>
            <View style={styles.articleMetaRow}>
              <View style={styles.articleMetaPill}>
                <Text style={styles.articleMetaText}>{article.course}</Text>
              </View>
              <View style={styles.articleMetaPill}>
                <Text style={styles.articleMetaText}>{article.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredArticles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum conteudo encontrado</Text>
            <Text style={styles.emptyText}>
              Tente buscar por educacao fisica, biologia, matematica ou metodologia.
            </Text>
          </View>
        )}
      </View>

      {relatedVideos.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {appliedMode === 'channels' ? 'Principais canais e aulas' : 'Videoaulas relacionadas'}
          </Text>
          {relatedVideos.map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.sourceItem}
              onPress={() =>
                router.push({
                  pathname: '/recurso/[id]',
                  params: { id: 'videoaulas' },
                })
              }
            >
              <Text style={styles.sourceName}>{video.title}</Text>
              <Text style={styles.sourceType}>
                {video.creator} | {video.platform} | {video.course}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {relatedBooks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leituras relacionadas</Text>
          {relatedBooks.map((book) => (
            <View key={book.id} style={styles.toolItem}>
              <Text style={styles.toolTitle}>{book.title}</Text>
              <Text style={styles.articleCategory}>
                {book.author} | {book.course} | {book.year}
              </Text>
              <Text style={styles.toolText}>{book.authorBio}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fontes sugeridas</Text>
        <View style={styles.sourceList}>
          {researchSources.map((source) => (
            <TouchableOpacity
              key={source.name}
              style={styles.sourceItem}
              onPress={() => {
                const nextQuery = appliedQuery
                  ? `${appliedQuery} ${source.name}`
                  : `${query} ${source.name}`.trim();

                setQuery(nextQuery);
                registerSearch(nextQuery);
              }}
            >
              <Text style={styles.sourceName}>{source.name}</Text>
              <Text style={styles.sourceType}>{source.type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Buscas recentes</Text>
          <TouchableOpacity onPress={clearRecentSearches}>
            <Text style={styles.sectionLink}>Limpar buscas</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentSearchCard}>
          {recentSearches.map((term) => (
            <TouchableOpacity
              key={term}
              style={styles.recentSearchItem}
              onPress={() => {
                setQuery(term);
                openSearchTheme({
                  query: term,
                  course: selectedCourse,
                  mode: discoveryMode,
                  filters: selectedFilters,
                });
              }}
            >
              <Text style={styles.recentSearchText}>{term}</Text>
              <Text style={styles.recentSearchCourse}>Reaplicar</Text>
            </TouchableOpacity>
          ))}
          {recentSearches.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma busca salva no momento.</Text>
          ) : null}
        </View>
      </View>
    </>
  );
}

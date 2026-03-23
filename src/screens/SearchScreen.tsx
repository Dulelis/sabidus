import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { researchSources } from '../data/mockData';
import { styles } from '../styles/appStyles';
import type {
  Article,
  BookSuggestion,
  ResourceModule,
  UnifiedSearchResult,
  VideoLesson,
} from '../types/app';
import { useStudy } from '../context/StudyContext';

type SearchScreenProps = {
  filteredArticles: Article[];
  relatedBooks: BookSuggestion[];
  relatedCourseLabel: string;
  relatedResources: ResourceModule[];
  relatedVideos: VideoLesson[];
  unifiedResults: UnifiedSearchResult[];
  query: string;
  setQuery: (value: string) => void;
  selectedCourse: string;
  setSelectedCourse: (value: string) => void;
};

export function SearchScreen({
  filteredArticles,
  relatedBooks,
  relatedCourseLabel,
  relatedResources,
  relatedVideos,
  unifiedResults,
  query,
  setQuery,
  selectedCourse,
  setSelectedCourse,
}: SearchScreenProps) {
  const {
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
  }

  function handleApplySearch() {
    if (!query.trim()) {
      return;
    }

    openSearchTheme({
      query,
      course: selectedCourse,
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
    });

    const targetPath = `/pesquisa-profunda?theme=${encodeURIComponent(normalizedQuery)}`;

    if (typeof window !== 'undefined') {
      window.open(targetPath, '_blank', 'noopener,noreferrer');
      return;
    }

    router.push({
      pathname: '/pesquisa-profunda',
      params: { theme: normalizedQuery },
    });
  }

  function openUnifiedResult(result: UnifiedSearchResult) {
    if (result.routeType === 'article' && result.routeId) {
      router.push(`/artigo/${result.routeId}`);
      return;
    }

    if (result.routeType === 'resource' && result.routeId) {
      router.push(`/recurso/${result.routeId}`);
      return;
    }

    if (result.routeType === 'tab' && result.routeId) {
      if (result.routeId === 'recursos') {
        router.push('/recursos');
        return;
      }

      if (result.routeId === 'conta') {
        router.push('/conta');
      }
    }

    if (result.routeType === 'external' && result.routeUrl) {
      if (typeof window !== 'undefined') {
        window.open(result.routeUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      void Linking.openURL(result.routeUrl);
    }
  }

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.screenTitle}>Pesquisar</Text>
        <Text style={styles.screenSubtitle}>
          Encontre artigos, pesquisas e materiais para aprofundar o estudo.
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

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleSaveSearch}
      >
        <Text style={styles.secondaryButtonText}>Salvar busca atual</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleApplySearch}
      >
        <Text style={styles.searchButtonText}>Abrir tema pesquisado</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleOpenDeepSearch}
      >
        <Text style={styles.secondaryButtonText}>Aprofundar na internet</Text>
      </TouchableOpacity>

      {query.trim() ? (
        <View style={styles.detailHero}>
          <Text style={styles.articleCategory}>Tema pesquisado</Text>
          <Text style={styles.detailTitle}>{query}</Text>
          <Text style={styles.detailDescription}>
            {relatedCourseLabel
              ? `Curso relacionado: ${relatedCourseLabel}. Explore abaixo os materiais e atalhos montados para este tema.`
              : 'Explore abaixo os materiais e atalhos montados para este tema.'}
          </Text>
        </View>
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

      {query.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tudo relacionado ao tema</Text>
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

      {query.trim() ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explorar neste tema</Text>
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
          <Text style={styles.sectionTitle}>Resultados</Text>
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
          <Text style={styles.sectionTitle}>Videoaulas relacionadas</Text>
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
                setQuery(source.name);
                registerSearch(source.name);
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

import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { ScreenLayout } from '@/components/ScreenLayout';
import { useStudy } from '@/context/StudyContext';
import {
  articles,
  bookSuggestions,
  enemTopics,
  formulaGuides,
  resourceModules,
  simulatedExams,
  studyMethods,
  videoLessons,
} from '@/data/mockData';
import { requestDeepSearch, type DeepSearchResponse } from '@/lib/apiClient';
import {
  getDiscoveryProfile,
  parseDiscoveryFilters,
} from '@/lib/discoveryProfiles';
import { SearchScreen } from '@/screens/SearchScreen';
import type { DiscoveryMode, UnifiedSearchResult } from '@/types/app';

function normalizeSearchTerm(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function scoreContent(query: string, ...parts: string[]) {
  const normalizedQuery = normalizeSearchTerm(query);

  if (!normalizedQuery) {
    return 0;
  }

  const content = normalizeSearchTerm(parts.join(' '));
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  let score = 0;

  if (content.includes(normalizedQuery)) {
    score += 8;
  }

  for (const term of terms) {
    if (content.includes(term)) {
      score += 3;
    }
  }

  return score;
}

function includesCourseContext(value: string, courseLabel: string) {
  const normalizedValue = normalizeSearchTerm(value);
  const normalizedCourseLabel = normalizeSearchTerm(courseLabel);

  if (!normalizedValue || !normalizedCourseLabel) {
    return false;
  }

  return (
    normalizedValue.includes(normalizedCourseLabel) ||
    normalizedCourseLabel.includes(normalizedValue)
  );
}

export default function SearchRoute() {
  const {
    activeSearchCourse,
    activeSearchFilters,
    activeSearchMode,
    activeSearchQuery,
    courseCatalog,
    courseKnowledge,
    customSummaries,
    studyMaterials,
  } = useStudy();
  const params = useLocalSearchParams<{
    query?: string;
    course?: string;
    mode?: DiscoveryMode;
    filters?: string | string[];
  }>();
  const [query, setQuery] = useState(params.query ?? activeSearchQuery ?? '');
  const [selectedCourse, setSelectedCourse] = useState(
    params.course ?? activeSearchCourse ?? 'todos'
  );
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>(
    (params.mode as DiscoveryMode) ?? activeSearchMode ?? 'general'
  );
  const [selectedFilters, setSelectedFilters] = useState<string[]>(
    parseDiscoveryFilters(params.filters).length > 0
      ? parseDiscoveryFilters(params.filters)
      : activeSearchFilters ?? []
  );
  const [themeInsight, setThemeInsight] = useState<DeepSearchResponse | null>(null);
  const [isThemeInsightLoading, setIsThemeInsightLoading] = useState(false);
  const [themeInsightError, setThemeInsightError] = useState('');

  useEffect(() => {
    if (params.query) {
      setQuery(params.query);
      return;
    }

    if (activeSearchQuery) {
      setQuery(activeSearchQuery);
    }
  }, [activeSearchQuery, params.query]);

  useEffect(() => {
    if (params.course) {
      setSelectedCourse(params.course);
      return;
    }

    if (activeSearchCourse) {
      setSelectedCourse(activeSearchCourse);
    }
  }, [activeSearchCourse, params.course]);

  useEffect(() => {
    if (params.mode) {
      setDiscoveryMode(params.mode as DiscoveryMode);
      return;
    }

    setDiscoveryMode(activeSearchMode || 'general');
  }, [activeSearchMode, params.mode]);

  useEffect(() => {
    const routeFilters = parseDiscoveryFilters(params.filters);

    if (routeFilters.length > 0) {
      setSelectedFilters(routeFilters);
      return;
    }

    setSelectedFilters(activeSearchFilters ?? []);
  }, [activeSearchFilters, params.filters]);

  const appliedQuery = (params.query ?? activeSearchQuery ?? '').trim();
  const appliedCourse = (params.course ?? activeSearchCourse ?? 'todos').trim() || 'todos';
  const appliedMode = ((params.mode as DiscoveryMode) ?? activeSearchMode ?? 'general').trim() as DiscoveryMode;
  const appliedFilters = useMemo(
    () => parseDiscoveryFilters(params.filters).length > 0
      ? parseDiscoveryFilters(params.filters)
      : activeSearchFilters,
    [activeSearchFilters, params.filters]
  );
  const discoveryProfile = useMemo(
    () => getDiscoveryProfile(discoveryMode),
    [discoveryMode]
  );
  const appliedDiscoveryProfile = useMemo(
    () => getDiscoveryProfile(appliedMode),
    [appliedMode]
  );

  const appliedCourseLabel = useMemo(() => {
    if (appliedCourse === 'todos') {
      return '';
    }

    return courseCatalog.find((course) => course.id === appliedCourse)?.label || appliedCourse;
  }, [appliedCourse, courseCatalog]);

  const appliedCourseKnowledge = useMemo(() => {
    const normalizedLabel = appliedCourseLabel.toLowerCase();

    return (
      courseKnowledge.find(
        (item) =>
          item.courseId === appliedCourse ||
          item.courseLabel.toLowerCase() === normalizedLabel
      ) ?? null
    );
  }, [appliedCourse, appliedCourseLabel, courseKnowledge]);

  const hasPendingSearch =
    normalizeSearchTerm(query) !== normalizeSearchTerm(appliedQuery) ||
    normalizeSearchTerm(selectedCourse) !== normalizeSearchTerm(appliedCourse) ||
    normalizeSearchTerm(discoveryMode) !== normalizeSearchTerm(appliedMode) ||
    normalizeSearchTerm(selectedFilters.join(',')) !== normalizeSearchTerm(appliedFilters.join(','));

  const filteredArticles = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(appliedQuery);
    const normalizedSelectedCourse = normalizeSearchTerm(appliedCourse);

    const courseFiltered = articles.filter((article) =>
      normalizedSelectedCourse === 'todos'
        ? true
        : normalizeSearchTerm(article.course) === normalizedSelectedCourse
    );

    if (!normalizedQuery) {
      return courseFiltered;
    }

    return courseFiltered.filter((article) => {
      const content = [
        article.title,
        article.category,
        article.description,
        article.course,
        article.source,
        article.author,
        article.authorBio,
        article.body,
      ].join(' ');

      return normalizeSearchTerm(content).includes(normalizedQuery);
    });
  }, [appliedCourse, appliedQuery]);

  const relatedCourseLabel = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(appliedQuery);

    if (appliedCourseLabel) {
      return appliedCourseLabel;
    }

    if (!normalizedQuery) {
      return appliedCourseLabel;
    }

    const directCourseMatch = courseCatalog.find((course) => {
      if (course.id === 'todos') {
        return false;
      }

      return normalizeSearchTerm(course.label).includes(normalizedQuery);
    });

    if (directCourseMatch) {
      return directCourseMatch.label;
    }

    if (filteredArticles[0]?.course) {
      return filteredArticles[0].course;
    }

    const matchingVideo = videoLessons.find((lesson) =>
      normalizeSearchTerm(
        `${lesson.title} ${lesson.creator} ${lesson.creatorBio} ${lesson.course}`
      ).includes(normalizedQuery)
    );

    if (matchingVideo) {
      return matchingVideo.course;
    }

    const matchingBook = bookSuggestions.find((book) =>
      normalizeSearchTerm(
        `${book.title} ${book.author} ${book.authorBio} ${book.course}`
      ).includes(normalizedQuery)
    );

    return matchingBook?.course ?? appliedCourseLabel;
  }, [appliedCourseLabel, appliedQuery, courseCatalog, filteredArticles]);

  const relatedResources = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(appliedQuery);
    const normalizedRelatedCourse = normalizeSearchTerm(relatedCourseLabel);

    return resourceModules.filter((resource) => {
      const content = normalizeSearchTerm(`${resource.title} ${resource.summary}`);

      if (!normalizedQuery) {
        return resource.status === 'Ativo';
      }

      return (
        content.includes(normalizedQuery) ||
        (normalizedRelatedCourse &&
          content.includes(normalizedRelatedCourse.replace(/\s+/g, ' '))) ||
        (normalizedQuery.includes('educacao fisica') &&
          ['videoaulas', 'metodos-estudo', 'simulados'].includes(resource.id))
      );
    });
  }, [appliedQuery, relatedCourseLabel]);

  const relatedVideos = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(appliedQuery);
    const normalizedRelatedCourse = normalizeSearchTerm(relatedCourseLabel);

    return videoLessons.filter((lesson) => {
      const content = normalizeSearchTerm(
        `${lesson.title} ${lesson.creator} ${lesson.creatorBio} ${lesson.course}`
      );

      if (!normalizedQuery) {
        return (
          !normalizedRelatedCourse ||
          normalizeSearchTerm(lesson.course) === normalizedRelatedCourse
        );
      }

      return (
        content.includes(normalizedQuery) ||
        (normalizedRelatedCourse &&
          normalizeSearchTerm(lesson.course) === normalizedRelatedCourse)
      );
    });
  }, [appliedQuery, relatedCourseLabel]);

  const relatedBooks = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(appliedQuery);
    const normalizedRelatedCourse = normalizeSearchTerm(relatedCourseLabel);

    return bookSuggestions.filter((book) => {
      const content = normalizeSearchTerm(
        `${book.title} ${book.author} ${book.authorBio} ${book.course}`
      );

      if (!normalizedQuery) {
        return (
          !normalizedRelatedCourse ||
          normalizeSearchTerm(book.course) === normalizedRelatedCourse
        );
      }

      return (
        content.includes(normalizedQuery) ||
        (normalizedRelatedCourse && normalizeSearchTerm(book.course) === normalizedRelatedCourse)
      );
    });
  }, [appliedQuery, relatedCourseLabel]);

  useEffect(() => {
    let isMounted = true;

    async function loadThemeInsight() {
      if (!appliedQuery) {
        if (isMounted) {
          setThemeInsight(null);
          setThemeInsightError('');
          setIsThemeInsightLoading(false);
        }
        return;
      }

      setIsThemeInsightLoading(true);
      setThemeInsightError('');

      try {
        const response = await requestDeepSearch({
          theme: appliedQuery,
          course: relatedCourseLabel || appliedCourseLabel || undefined,
          mode: appliedMode,
          filters: appliedFilters,
          courseOverview: appliedCourseKnowledge?.overview,
          focusAreas: appliedCourseKnowledge?.focusAreas,
          relatedTerms: appliedCourseKnowledge?.relatedTerms,
        });

        if (!isMounted) {
          return;
        }

        setThemeInsight(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setThemeInsight(null);
        setThemeInsightError(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel analisar o tema com apoio da IA.'
        );
      } finally {
        if (isMounted) {
          setIsThemeInsightLoading(false);
        }
      }
    }

    void loadThemeInsight();

    return () => {
      isMounted = false;
    };
  }, [
    appliedCourseKnowledge,
    appliedCourseLabel,
    appliedFilters,
    appliedMode,
    appliedQuery,
    relatedCourseLabel,
  ]);

  const unifiedResults = useMemo(() => {
    const queryText = appliedQuery.trim();
    const normalizedQuery = normalizeSearchTerm(queryText);
    const contextCourseLabel = relatedCourseLabel || appliedCourseLabel;
    const normalizedContextCourse = normalizeSearchTerm(contextCourseLabel);
    const supportsExactResources =
      /matematica|fisica|quimica/.test(normalizedContextCourse) ||
      /formula|equacao|calculo|molaridade|bhaskara/.test(normalizedQuery);

    if (!queryText) {
      return [] as UnifiedSearchResult[];
    }

    const results: Array<UnifiedSearchResult & { score: number }> = [];

    for (const article of filteredArticles) {
      const score =
        scoreContent(
          queryText,
          article.title,
          article.category,
          article.description,
          article.body,
          article.course
        ) +
        (includesCourseContext(article.course, contextCourseLabel) ? 4 : 0);

      if (score > 0) {
        results.push({
          id: `article-${article.id}`,
          title: article.title,
          subtitle: `${article.course} | ${article.duration}`,
          description: article.description,
          badge: 'Artigo',
          routeType: 'article',
          routeId: article.id,
          score,
        });
      }
    }

    for (const video of relatedVideos) {
      const score =
        scoreContent(
          queryText,
          video.title,
          video.creator,
          video.creatorBio,
          video.course
        ) +
        (includesCourseContext(video.course, contextCourseLabel) ? 4 : 0) +
        2;

      if (score > 0) {
        results.push({
          id: `video-${video.id}`,
          title: video.title,
          subtitle: `${video.creator} | ${video.platform}`,
          description: video.creatorBio,
          badge: 'Videoaula',
          routeType: 'resource',
          routeId: 'videoaulas',
          routeParams: {
            id: 'videoaulas',
            focus: video.id,
            query: appliedQuery,
            course: contextCourseLabel,
          },
          score,
        });
      }
    }

    for (const resource of relatedResources) {
      const score = scoreContent(queryText, resource.title, resource.summary) + 2;

      if (score > 0) {
        results.push({
          id: `resource-${resource.id}`,
          title: resource.title,
          subtitle: resource.status,
          description: resource.summary,
          badge: 'Recurso',
          routeType: 'resource',
          routeId: resource.id,
          routeParams: {
            id: resource.id,
            query: appliedQuery,
            course: contextCourseLabel,
          },
          score,
        });
      }
    }

    for (const book of relatedBooks) {
      const score =
        scoreContent(
          queryText,
          book.title,
          book.author,
          book.authorBio,
          book.course
        ) +
        (includesCourseContext(book.course, contextCourseLabel) ? 4 : 0) +
        1;

      if (score > 0) {
        results.push({
          id: `book-${book.id}`,
          title: book.title,
          subtitle: `${book.author} | ${book.course}`,
          description: book.authorBio,
          badge: 'Leitura',
          routeType: 'tab',
          routeId: 'recursos',
          score,
        });
      }
    }

    for (const method of studyMethods) {
      const score =
        scoreContent(queryText, method.title, method.description, method.howItWorks) +
        2;

      if (score > 0) {
        results.push({
          id: `method-${method.id}`,
          title: method.title,
          subtitle: 'Metodo de estudo',
          description: method.description,
          badge: 'Metodo',
          routeType: 'resource',
          routeId: 'metodos-estudo',
          routeParams: {
            id: 'metodos-estudo',
            focus: method.id,
            query: appliedQuery,
            course: contextCourseLabel,
          },
          score,
        });
      }
    }

    for (const formula of formulaGuides) {
      const score =
        scoreContent(queryText, formula.title, formula.area, formula.explanation) +
        (supportsExactResources ? 2 : 1);

      if (score > 0) {
        results.push({
          id: `formula-${formula.id}`,
          title: formula.title,
          subtitle: formula.area,
          description: formula.explanation,
          badge: 'Formula',
          routeType: 'resource',
          routeId: 'formulas',
          routeParams: {
            id: 'formulas',
            focus: formula.id,
            query: appliedQuery,
            course: contextCourseLabel,
          },
          score,
        });
      }
    }

    for (const topic of enemTopics) {
      const score =
        scoreContent(queryText, topic.subject, topic.branch, topic.summary) +
        (includesCourseContext(topic.subject, contextCourseLabel) ? 3 : 1);

      if (score > 0) {
        results.push({
          id: `enem-${topic.id}`,
          title: `${topic.subject} | ${topic.branch}`,
          subtitle: 'Conteudo do ENEM',
          description: topic.summary,
          badge: 'ENEM',
          routeType: 'resource',
          routeId: 'enem',
          routeParams: {
            id: 'enem',
            focus: topic.id,
            query: appliedQuery,
            course: contextCourseLabel,
          },
          score,
        });
      }
    }

    for (const exam of simulatedExams) {
      const score =
        scoreContent(queryText, exam.title, exam.course, exam.focus) +
        (includesCourseContext(exam.course, contextCourseLabel) ? 4 : 0) +
        2;

      if (score > 0) {
        results.push({
          id: `exam-${exam.id}`,
          title: exam.title,
          subtitle: `${exam.course} | ${exam.questionCount}`,
          description: exam.focus,
          badge: 'Simulado',
          routeType: 'resource',
          routeId: 'simulados',
          routeParams: {
            id: 'simulados',
            focus: exam.id,
            query: appliedQuery,
            course: contextCourseLabel,
          },
          score,
        });
      }
    }

    for (const summary of customSummaries) {
      const score =
        scoreContent(
          queryText,
          summary.subject,
          summary.summary,
          summary.openQuestions
        ) +
        (includesCourseContext(summary.subject, contextCourseLabel) ? 4 : 0) +
        1;

      if (score > 0) {
        results.push({
          id: `summary-${summary.id}`,
          title: `Resumo de ${summary.subject}`,
          subtitle: 'Anotacao salva',
          description: summary.summary,
          badge: 'Resumo',
          routeType: 'tab',
          routeId: 'conta',
          score,
        });
      }
    }

    for (const knowledge of courseKnowledge) {
      const score =
        scoreContent(
          queryText,
          knowledge.courseLabel,
          knowledge.overview,
          knowledge.focusAreas.join(' '),
          knowledge.relatedTerms.join(' '),
          knowledge.suggestedPaths.join(' ')
        ) +
        (includesCourseContext(knowledge.courseLabel, contextCourseLabel) ? 5 : 0);

      if (score > 0) {
        results.push({
          id: `course-knowledge-${knowledge.courseId}`,
          title: `Conhecimento de ${knowledge.courseLabel}`,
          subtitle: 'Curso gerenciado',
          description: knowledge.overview,
          badge: 'Curso',
          routeType: 'tab',
          routeId: 'pesquisar',
          routeParams: {
            query: appliedQuery,
            course: knowledge.courseId,
            mode: appliedMode,
            filters: appliedFilters.join(','),
          },
          score,
        });
      }
    }

    for (const material of studyMaterials) {
      const score =
        scoreContent(
          queryText,
          material.title,
          material.kind,
          material.mimeType
        ) + 1;

      if (score > 0) {
        results.push({
          id: `material-${material.id}`,
          title: material.title,
          subtitle:
            material.kind === 'arquivo'
              ? 'Arquivo do aparelho'
              : material.kind === 'arquivo-externo'
                ? 'Arquivo externo'
                : material.kind === 'camera'
                  ? 'Capturado pela camera'
                  : 'Link de estudo',
          description:
            material.storageMode === 'session'
              ? 'Material local disponivel nesta sessao.'
              : 'Material salvo para reabrir depois.',
          badge: 'Material',
          routeType: 'external',
          routeUrl: material.url,
          score,
        });
      }
    }

    if (themeInsight) {
      for (const source of themeInsight.sources) {
        const score =
          scoreContent(
            queryText,
            source.title,
            source.snippet,
            source.domain,
            source.url,
            contextCourseLabel
          ) + 10;

        if (score > 0) {
          results.push({
            id: `web-source-${source.url}`,
            title: source.title,
            subtitle: source.domain || 'Fonte web',
            description: source.snippet,
            badge:
              appliedMode === 'scientific-articles'
                ? 'Artigo web'
                : appliedMode === 'academic-research'
                  ? 'Pesquisa web'
                  : 'Fonte web',
            routeType: 'web-result',
            routeUrl: source.url,
            routeParams: {
              title: source.title,
              url: source.url,
              snippet: source.snippet,
              domain: source.domain,
              badge:
                appliedMode === 'scientific-articles'
                  ? 'Artigo web'
                  : appliedMode === 'academic-research'
                    ? 'Pesquisa web'
                    : 'Fonte web',
              theme: appliedQuery,
              course: contextCourseLabel,
            },
            sourceDomain: source.domain,
            score,
          });
        }
      }

      for (const video of themeInsight.videos) {
        const score =
          scoreContent(
            queryText,
            video.title,
            video.snippet,
            video.domain,
            video.url,
            contextCourseLabel
          ) + 9;

        if (score > 0) {
          results.push({
            id: `web-video-${video.url}`,
            title: video.title,
            subtitle: video.domain || 'Video na web',
            description: video.snippet,
            badge: 'Video web',
            routeType: 'web-result',
            routeUrl: video.url,
            routeParams: {
              title: video.title,
              url: video.url,
              snippet: video.snippet,
              domain: video.domain,
              badge: 'Video web',
              theme: appliedQuery,
              course: contextCourseLabel,
            },
            sourceDomain: video.domain,
            score,
          });
        }
      }
    }

    const uniqueResults = [];
    const seenIds = new Set();

    for (const result of results.sort((a, b) => b.score - a.score)) {
      if (seenIds.has(result.id)) {
        continue;
      }

      seenIds.add(result.id);
      uniqueResults.push(result);
    }

    return uniqueResults;
  }, [
    appliedCourseLabel,
    appliedFilters,
    appliedMode,
    appliedQuery,
    courseKnowledge,
    customSummaries,
    filteredArticles,
    relatedBooks,
    relatedResources,
    relatedCourseLabel,
    relatedVideos,
    studyMaterials,
    themeInsight,
  ]);

  function toggleFilter(filterId: string) {
    setSelectedFilters((current) =>
      current.includes(filterId)
        ? current.filter((item) => item !== filterId)
        : [...current, filterId]
    );
  }

  return (
    <ScreenLayout>
      <SearchScreen
        appliedQuery={appliedQuery}
        appliedMode={appliedMode}
        appliedFilters={appliedFilters}
        discoveryMode={discoveryMode}
        discoveryProfile={discoveryProfile}
        appliedDiscoveryProfile={appliedDiscoveryProfile}
        filteredArticles={filteredArticles}
        hasPendingSearch={hasPendingSearch}
        isThemeInsightLoading={isThemeInsightLoading}
        relatedBooks={relatedBooks}
        relatedCourseLabel={relatedCourseLabel}
        relatedResources={relatedResources}
        relatedVideos={relatedVideos}
        selectedFilters={selectedFilters}
        toggleFilter={toggleFilter}
        clearFilters={() => setSelectedFilters([])}
        themeInsight={themeInsight}
        themeInsightError={themeInsightError}
        unifiedResults={unifiedResults}
        query={query}
        setQuery={setQuery}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        setDiscoveryMode={setDiscoveryMode}
      />
    </ScreenLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { ScreenLayout } from '@/components/ScreenLayout';
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
import { SearchScreen } from '@/screens/SearchScreen';
import { useStudy } from '@/context/StudyContext';
import type { UnifiedSearchResult } from '@/types/app';

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

export default function SearchRoute() {
  const {
    activeSearchCourse,
    activeSearchQuery,
    courseCatalog,
    courseKnowledge,
    customSummaries,
    studyMaterials,
  } = useStudy();
  const params = useLocalSearchParams<{ query?: string; course?: string }>();
  const [query, setQuery] = useState(params.query ?? activeSearchQuery ?? '');
  const [selectedCourse, setSelectedCourse] = useState(
    params.course ?? activeSearchCourse ?? 'todos'
  );

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

  const filteredArticles = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(query);
    const normalizedSelectedCourse = normalizeSearchTerm(selectedCourse);

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
  }, [query, selectedCourse]);

  const relatedCourseLabel = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(query);

    if (!normalizedQuery) {
      return selectedCourse === 'todos'
        ? ''
        : courseCatalog.find((course) => course.id === selectedCourse)?.label || selectedCourse;
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

    return matchingBook?.course ?? '';
  }, [courseCatalog, filteredArticles, query, selectedCourse]);

  const relatedResources = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(query);
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
  }, [query, relatedCourseLabel]);

  const relatedVideos = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(query);
    const normalizedRelatedCourse = normalizeSearchTerm(relatedCourseLabel);

    return videoLessons.filter((lesson) => {
      const content = normalizeSearchTerm(
        `${lesson.title} ${lesson.creator} ${lesson.creatorBio} ${lesson.course}`
      );

      if (!normalizedQuery) {
        return !normalizedRelatedCourse || normalizeSearchTerm(lesson.course) === normalizedRelatedCourse;
      }

      return (
        content.includes(normalizedQuery) ||
        (normalizedRelatedCourse && normalizeSearchTerm(lesson.course) === normalizedRelatedCourse)
      );
    });
  }, [query, relatedCourseLabel]);

  const relatedBooks = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(query);
    const normalizedRelatedCourse = normalizeSearchTerm(relatedCourseLabel);

    return bookSuggestions.filter((book) => {
      const content = normalizeSearchTerm(
        `${book.title} ${book.author} ${book.authorBio} ${book.course}`
      );

      if (!normalizedQuery) {
        return !normalizedRelatedCourse || normalizeSearchTerm(book.course) === normalizedRelatedCourse;
      }

      return (
        content.includes(normalizedQuery) ||
        (normalizedRelatedCourse && normalizeSearchTerm(book.course) === normalizedRelatedCourse)
      );
    });
  }, [query, relatedCourseLabel]);

  const unifiedResults = useMemo(() => {
    const queryText = query.trim();

    if (!queryText) {
      return [] as UnifiedSearchResult[];
    }

    const results: Array<UnifiedSearchResult & { score: number }> = [];

    for (const article of filteredArticles) {
      const score = scoreContent(
        queryText,
        article.title,
        article.category,
        article.description,
        article.body,
        article.course
      );

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
      const score = scoreContent(
        queryText,
        video.title,
        video.creator,
        video.creatorBio,
        video.course
      );

      if (score > 0) {
        results.push({
          id: `video-${video.id}`,
          title: video.title,
          subtitle: `${video.creator} | ${video.platform}`,
          description: video.creatorBio,
          badge: 'Videoaula',
          routeType: 'resource',
          routeId: 'videoaulas',
          score,
        });
      }
    }

    for (const resource of relatedResources) {
      const score = scoreContent(queryText, resource.title, resource.summary);

      if (score > 0) {
        results.push({
          id: `resource-${resource.id}`,
          title: resource.title,
          subtitle: resource.status,
          description: resource.summary,
          badge: 'Recurso',
          routeType: 'resource',
          routeId: resource.id,
          score,
        });
      }
    }

    for (const book of relatedBooks) {
      const score = scoreContent(
        queryText,
        book.title,
        book.author,
        book.authorBio,
        book.course
      );

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
      const score = scoreContent(queryText, method.title, method.description, method.howItWorks);

      if (score > 0) {
        results.push({
          id: `method-${method.id}`,
          title: method.title,
          subtitle: 'Metodo de estudo',
          description: method.description,
          badge: 'Metodo',
          routeType: 'resource',
          routeId: 'metodos-estudo',
          score,
        });
      }
    }

    for (const formula of formulaGuides) {
      const score = scoreContent(queryText, formula.title, formula.area, formula.explanation);

      if (score > 0) {
        results.push({
          id: `formula-${formula.id}`,
          title: formula.title,
          subtitle: formula.area,
          description: formula.explanation,
          badge: 'Formula',
          routeType: 'resource',
          routeId: 'formulas',
          score,
        });
      }
    }

    for (const topic of enemTopics) {
      const score = scoreContent(queryText, topic.subject, topic.branch, topic.summary);

      if (score > 0) {
        results.push({
          id: `enem-${topic.id}`,
          title: `${topic.subject} | ${topic.branch}`,
          subtitle: 'Conteudo do ENEM',
          description: topic.summary,
          badge: 'ENEM',
          routeType: 'resource',
          routeId: 'enem',
          score,
        });
      }
    }

    for (const exam of simulatedExams) {
      const score = scoreContent(queryText, exam.title, exam.course, exam.focus);

      if (score > 0) {
        results.push({
          id: `exam-${exam.id}`,
          title: exam.title,
          subtitle: `${exam.course} | ${exam.questionCount}`,
          description: exam.focus,
          badge: 'Simulado',
          routeType: 'resource',
          routeId: 'simulados',
          score,
        });
      }
    }

    for (const summary of customSummaries) {
      const score = scoreContent(
        queryText,
        summary.subject,
        summary.summary,
        summary.openQuestions
      );

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
      const score = scoreContent(
        queryText,
        knowledge.courseLabel,
        knowledge.overview,
        knowledge.focusAreas.join(' '),
        knowledge.relatedTerms.join(' '),
        knowledge.suggestedPaths.join(' ')
      );

      if (score > 0) {
        results.push({
          id: `course-knowledge-${knowledge.courseId}`,
          title: `Conhecimento de ${knowledge.courseLabel}`,
          subtitle: 'Curso gerenciado',
          description: knowledge.overview,
          badge: 'Curso',
          routeType: 'none',
          score,
        });
      }
    }

    for (const material of studyMaterials) {
      const score = scoreContent(
        queryText,
        material.title,
        material.kind,
        material.mimeType
      );

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

    return results.sort((a, b) => b.score - a.score).slice(0, 12);
  }, [
    courseKnowledge,
    customSummaries,
    filteredArticles,
    query,
    relatedBooks,
    relatedResources,
    relatedVideos,
    studyMaterials,
  ]);

  return (
    <ScreenLayout>
      <SearchScreen
        filteredArticles={filteredArticles}
        relatedBooks={relatedBooks}
        relatedCourseLabel={relatedCourseLabel}
        relatedResources={relatedResources}
        relatedVideos={relatedVideos}
        unifiedResults={unifiedResults}
        query={query}
        setQuery={setQuery}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
      />
    </ScreenLayout>
  );
}

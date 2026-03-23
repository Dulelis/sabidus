import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  assessments,
  courses,
  performanceEntries,
  summaryNotes,
  tasks,
} from '../data/mockData';
import { buildCourseId, generateCourseKnowledge } from '../lib/courseKnowledge';
import type {
  AssessmentItem,
  CourseKnowledge,
  CourseOption,
  PerformanceEntry,
  StudyMaterial,
  SummaryNote,
} from '../types/app';

const STORAGE_KEY = 'webschool-study-state';

function dedupeStrings(items: string[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const normalized = item.trim().toLowerCase();

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

type PersistedStudyState = {
  savedArticleIds: string[];
  recentSearches: string[];
  customTasks: string[];
  calendarItems: AssessmentItem[];
  customPerformance: PerformanceEntry[];
  customSummaries: SummaryNote[];
  desiredCourse: string;
  activeSearchQuery: string;
  activeSearchCourse: string;
  courseCatalog: CourseOption[];
  courseKnowledge: CourseKnowledge[];
  studyMaterials: StudyMaterial[];
};

type StudyContextValue = {
  savedArticleIds: string[];
  toggleSavedArticle: (id: string) => void;
  isSavedArticle: (id: string) => boolean;
  recentSearches: string[];
  registerSearch: (term: string) => void;
  clearRecentSearches: () => void;
  customTasks: string[];
  addTask: (task: string) => boolean;
  updateTask: (currentTask: string, nextTask: string) => 'updated' | 'duplicate' | 'invalid';
  deleteTask: (task: string) => boolean;
  clearTasks: () => void;
  calendarItems: AssessmentItem[];
  addCalendarItem: (item: {
    title: string;
    subject: string;
    type: 'Prova' | 'Trabalho';
    dueDate: string;
  }) => AssessmentItem | null;
  updateCalendarItem: (
    id: string,
    item: {
      title: string;
      subject: string;
      type: 'Prova' | 'Trabalho';
      dueDate: string;
    }
  ) => AssessmentItem | null;
  deleteCalendarItem: (id: string) => boolean;
  customPerformance: PerformanceEntry[];
  addPerformanceEntry: (item: { subject: string; grade: string }) => void;
  customSummaries: SummaryNote[];
  addSummaryNote: (item: {
    subject: string;
    summary: string;
    openQuestions: string;
  }) => void;
  desiredCourse: string;
  setDesiredCourse: (value: string) => void;
  courseCatalog: CourseOption[];
  courseKnowledge: CourseKnowledge[];
  addCourse: (label: string) => CourseOption | null;
  updateCourse: (id: string, label: string) => CourseOption | null;
  deleteCourse: (id: string) => void;
  studyMaterials: StudyMaterial[];
  addStudyMaterial: (item: {
    title: string;
    kind: StudyMaterial['kind'];
    url: string;
    mimeType?: string;
    storageMode?: StudyMaterial['storageMode'];
  }) => StudyMaterial | null;
  deleteStudyMaterial: (id: string) => boolean;
  activeSearchQuery: string;
  activeSearchCourse: string;
  openSearchTheme: (item: { query: string; course?: string }) => void;
  isHydrated: boolean;
};

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

function dedupeCourses(items: CourseOption[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const normalized = item.label.trim().toLowerCase();

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function dedupeCourseKnowledge(items: CourseKnowledge[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const normalized = item.courseLabel.trim().toLowerCase();

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function dedupeStudyMaterials(items: StudyMaterial[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const normalizedTitle = item.title.trim();
    const normalizedUrl = item.url.trim();

    if (!normalizedTitle || !normalizedUrl) {
      return false;
    }

    const signature = `${item.kind}:${normalizedUrl.toLowerCase()}`;

    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
}

export function StudyProvider({ children }: PropsWithChildren) {
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'pedagogia inclusiva',
    'citologia',
    'filosofia etica',
  ]);
  const [customTasks, setCustomTasks] = useState<string[]>(tasks);
  const [calendarItems, setCalendarItems] = useState<AssessmentItem[]>(assessments);
  const [customPerformance, setCustomPerformance] =
    useState<PerformanceEntry[]>(performanceEntries);
  const [customSummaries, setCustomSummaries] =
    useState<SummaryNote[]>(summaryNotes);
  const [desiredCourse, setDesiredCourse] = useState('');
  const [courseCatalog, setCourseCatalog] = useState<CourseOption[]>(courses);
  const [courseKnowledge, setCourseKnowledge] = useState<CourseKnowledge[]>(
    courses
      .filter((course) => course.id !== 'todos')
      .map((course) => generateCourseKnowledge(course.label))
  );
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [activeSearchCourse, setActiveSearchCourse] = useState('todos');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function loadPersistedState() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (!stored) {
          setIsHydrated(true);
          return;
        }

        const parsed = JSON.parse(stored) as Partial<PersistedStudyState>;

        if (Array.isArray(parsed.savedArticleIds)) {
          setSavedArticleIds(parsed.savedArticleIds);
        }

        if (Array.isArray(parsed.recentSearches)) {
          setRecentSearches(dedupeStrings(parsed.recentSearches));
        }

        if (Array.isArray(parsed.customTasks)) {
          setCustomTasks(dedupeStrings(parsed.customTasks));
        }

        if (Array.isArray(parsed.calendarItems)) {
          setCalendarItems(parsed.calendarItems);
        }

        if (Array.isArray(parsed.customPerformance)) {
          setCustomPerformance(parsed.customPerformance);
        }

        if (Array.isArray(parsed.customSummaries)) {
          setCustomSummaries(parsed.customSummaries);
        }

        if (typeof parsed.desiredCourse === 'string') {
          setDesiredCourse(parsed.desiredCourse);
        }

        if (typeof parsed.activeSearchQuery === 'string') {
          setActiveSearchQuery(parsed.activeSearchQuery);
        }

        if (typeof parsed.activeSearchCourse === 'string') {
          setActiveSearchCourse(parsed.activeSearchCourse);
        }

        if (Array.isArray(parsed.courseCatalog)) {
          setCourseCatalog(dedupeCourses(parsed.courseCatalog));
        }

        if (Array.isArray(parsed.courseKnowledge)) {
          setCourseKnowledge(dedupeCourseKnowledge(parsed.courseKnowledge));
        }

        if (Array.isArray(parsed.studyMaterials)) {
          setStudyMaterials(dedupeStudyMaterials(parsed.studyMaterials));
        }
      } catch {
        // Keep default state if local persistence cannot be read.
      } finally {
        setIsHydrated(true);
      }
    }

    void loadPersistedState();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const snapshot: PersistedStudyState = {
      savedArticleIds,
      recentSearches: dedupeStrings(recentSearches),
      customTasks: dedupeStrings(customTasks),
      calendarItems,
      customPerformance,
      customSummaries,
      desiredCourse,
      activeSearchQuery,
      activeSearchCourse,
      courseCatalog: dedupeCourses(courseCatalog),
      courseKnowledge: dedupeCourseKnowledge(courseKnowledge),
      studyMaterials: dedupeStudyMaterials(
        studyMaterials.filter((item) => item.storageMode === 'persisted')
      ),
    };

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    calendarItems,
    customPerformance,
    customSummaries,
    customTasks,
    desiredCourse,
    courseCatalog,
    courseKnowledge,
    studyMaterials,
    activeSearchCourse,
    activeSearchQuery,
    isHydrated,
    recentSearches,
    savedArticleIds,
  ]);

  function toggleSavedArticle(id: string) {
    setSavedArticleIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function isSavedArticle(id: string) {
    return savedArticleIds.includes(id);
  }

  function registerSearch(term: string) {
    const normalized = term.trim();

    if (!normalized) {
      return;
    }

    setRecentSearches((current) => {
      const withoutDuplicate = current.filter(
        (item) => item.toLowerCase() !== normalized.toLowerCase()
      );
      return [normalized, ...withoutDuplicate].slice(0, 5);
    });
  }

  function clearRecentSearches() {
    setRecentSearches([]);
  }

  function addTask(task: string) {
    const normalized = task.trim();

    if (!normalized) {
      return false;
    }

    const alreadyExists = customTasks.some(
      (item) => item.toLowerCase() === normalized.toLowerCase()
    );

    if (alreadyExists) {
      return false;
    }

    setCustomTasks((current) => [normalized, ...current]);
    return true;
  }

  function updateTask(currentTask: string, nextTask: string) {
    const normalizedCurrent = currentTask.trim();
    const normalizedNext = nextTask.trim();

    if (!normalizedCurrent || !normalizedNext) {
      return 'invalid';
    }

    const hasCurrent = customTasks.some(
      (item) => item.toLowerCase() === normalizedCurrent.toLowerCase()
    );

    if (!hasCurrent) {
      return 'invalid';
    }

    const duplicateExists = customTasks.some(
      (item) =>
        item.toLowerCase() === normalizedNext.toLowerCase() &&
        item.toLowerCase() !== normalizedCurrent.toLowerCase()
    );

    if (duplicateExists) {
      return 'duplicate';
    }

    setCustomTasks((current) =>
      current.map((item) =>
        item.toLowerCase() === normalizedCurrent.toLowerCase() ? normalizedNext : item
      )
    );

    return 'updated';
  }

  function deleteTask(task: string) {
    const normalized = task.trim().toLowerCase();

    if (!normalized) {
      return false;
    }

    const wasDeleted = customTasks.some((item) => item.toLowerCase() === normalized);

    if (!wasDeleted) {
      return false;
    }

    setCustomTasks((current) => current.filter((item) => item.toLowerCase() !== normalized));
    return true;
  }

  function clearTasks() {
    setCustomTasks([]);
  }

  function addCourse(label: string) {
    const normalizedLabel = label.trim();

    if (!normalizedLabel) {
      return null;
    }

    const existing = courseCatalog.find(
      (item) => item.label.toLowerCase() === normalizedLabel.toLowerCase()
    );

    if (existing) {
      const existingKnowledge = courseKnowledge.some(
        (item) => item.courseLabel.toLowerCase() === existing.label.toLowerCase()
      );

      if (!existingKnowledge && existing.id !== 'todos') {
        setCourseKnowledge((current) =>
          dedupeCourseKnowledge([...current, generateCourseKnowledge(existing.label)])
        );
      }

      return existing;
    }

    const createdCourse = {
      id: buildCourseId(normalizedLabel),
      label: normalizedLabel,
    };

    setCourseCatalog((current) => dedupeCourses([...current, createdCourse]));
    setCourseKnowledge((current) =>
      dedupeCourseKnowledge([...current, generateCourseKnowledge(normalizedLabel)])
    );

    return createdCourse;
  }

  function updateCourse(id: string, label: string) {
    const normalizedLabel = label.trim();

    if (!normalizedLabel || id === 'todos') {
      return null;
    }

    let updatedCourse: CourseOption | null = null;

    setCourseCatalog((current) =>
      dedupeCourses(
        current.map((item) => {
          if (item.id !== id) {
            return item;
          }

          updatedCourse = {
            ...item,
            label: normalizedLabel,
          };

          return updatedCourse;
        })
      )
    );

    setCourseKnowledge((current) => {
      const withoutCurrent = current.filter((item) => item.courseId !== id);
      return dedupeCourseKnowledge([
        ...withoutCurrent,
        {
          ...generateCourseKnowledge(normalizedLabel),
          courseId: id,
        },
      ]);
    });

    return updatedCourse;
  }

  function deleteCourse(id: string) {
    if (id === 'todos') {
      return;
    }

    const deletedCourseLabel =
      courseCatalog.find((item) => item.id === id)?.label.toLowerCase() || '';

    setCourseCatalog((current) => current.filter((item) => item.id !== id));
    setCourseKnowledge((current) => current.filter((item) => item.courseId !== id));

    setActiveSearchCourse((current) => (current === id ? 'todos' : current));
    setDesiredCourse((current) =>
      current.trim().toLowerCase() === deletedCourseLabel ? '' : current
    );
  }

  function addStudyMaterial(item: {
    title: string;
    kind: StudyMaterial['kind'];
    url: string;
    mimeType?: string;
    storageMode?: StudyMaterial['storageMode'];
  }) {
    const normalizedTitle = item.title.trim();
    const normalizedUrl = item.url.trim();

    if (!normalizedTitle || !normalizedUrl) {
      return null;
    }

    const duplicateExists = studyMaterials.some(
      (material) =>
        material.kind === item.kind &&
        material.url.toLowerCase() === normalizedUrl.toLowerCase()
    );

    if (duplicateExists) {
      return null;
    }

    const createdMaterial = {
      id: `material-${Date.now()}`,
      title: normalizedTitle,
      kind: item.kind,
      url: normalizedUrl,
      mimeType: item.mimeType?.trim() || 'application/octet-stream',
      storageMode: item.storageMode || 'persisted',
      addedAt: new Date().toISOString(),
    } satisfies StudyMaterial;

    setStudyMaterials((current) => [createdMaterial, ...current]);
    return createdMaterial;
  }

  function deleteStudyMaterial(id: string) {
    if (!id.trim()) {
      return false;
    }

    const wasDeleted = studyMaterials.some((material) => material.id === id);

    if (!wasDeleted) {
      return false;
    }

    setStudyMaterials((current) => current.filter((material) => material.id !== id));
    return true;
  }

  function addCalendarItem(item: {
    title: string;
    subject: string;
    type: 'Prova' | 'Trabalho';
    dueDate: string;
  }) {
    if (!item.title.trim() || !item.subject.trim() || !item.dueDate.trim()) {
      return null;
    }

    const color = item.type === 'Prova' ? '#2563EB' : '#EA580C';
    const createdItem = {
      id: `custom-${Date.now()}`,
      title: item.title.trim(),
      subject: item.subject.trim(),
      type: item.type,
      dueDate: item.dueDate.trim(),
      color,
    } satisfies AssessmentItem;

    setCalendarItems((current) => [createdItem, ...current]);

    return createdItem;
  }

  function updateCalendarItem(
    id: string,
    item: {
      title: string;
      subject: string;
      type: 'Prova' | 'Trabalho';
      dueDate: string;
    }
  ) {
    if (!id.trim() || !item.title.trim() || !item.subject.trim() || !item.dueDate.trim()) {
      return null;
    }

    const updatedItem = {
      id,
      title: item.title.trim(),
      subject: item.subject.trim(),
      type: item.type,
      dueDate: item.dueDate.trim(),
      color: item.type === 'Prova' ? '#2563EB' : '#EA580C',
    } satisfies AssessmentItem;

    const hasItem = calendarItems.some((calendarItem) => calendarItem.id === id);

    if (!hasItem) {
      return null;
    }

    setCalendarItems((current) =>
      current.map((calendarItem) => (calendarItem.id === id ? updatedItem : calendarItem))
    );

    return updatedItem;
  }

  function deleteCalendarItem(id: string) {
    if (!id.trim()) {
      return false;
    }

    const wasDeleted = calendarItems.some((calendarItem) => calendarItem.id === id);

    if (!wasDeleted) {
      return false;
    }

    setCalendarItems((current) => current.filter((calendarItem) => calendarItem.id !== id));
    return true;
  }

  function addPerformanceEntry(item: { subject: string; grade: string }) {
    if (!item.subject.trim() || !item.grade.trim()) {
      return;
    }

    const numericGrade = Number(item.grade);
    let status = 'Estavel';

    if (numericGrade >= 8) {
      status = 'Acima da meta';
    } else if (numericGrade < 7) {
      status = 'Precisa reforco';
    }

    setCustomPerformance((current) => [
      {
        subject: item.subject.trim(),
        grade: item.grade.trim(),
        status,
      },
      ...current,
    ]);
  }

  function addSummaryNote(item: {
    subject: string;
    summary: string;
    openQuestions: string;
  }) {
    if (!item.subject.trim() || !item.summary.trim()) {
      return;
    }

    setCustomSummaries((current) => [
      {
        id: `summary-${Date.now()}`,
        subject: item.subject.trim(),
        summary: item.summary.trim(),
        openQuestions: item.openQuestions.trim(),
      },
      ...current,
    ]);
  }

  function openSearchTheme(item: { query: string; course?: string }) {
    const normalizedQuery = item.query.trim();

    if (!normalizedQuery) {
      return;
    }

    setActiveSearchQuery(normalizedQuery);
    setActiveSearchCourse(item.course?.trim() || 'todos');
    registerSearch(normalizedQuery);
  }

  const value = useMemo(
    () => ({
      savedArticleIds,
      toggleSavedArticle,
      isSavedArticle,
      recentSearches,
      registerSearch,
      clearRecentSearches,
      customTasks,
      addTask,
      updateTask,
      deleteTask,
      clearTasks,
      calendarItems,
      addCalendarItem,
      updateCalendarItem,
      deleteCalendarItem,
      customPerformance,
      addPerformanceEntry,
      customSummaries,
      addSummaryNote,
      desiredCourse,
      setDesiredCourse,
      courseCatalog,
      courseKnowledge,
      addCourse,
      updateCourse,
      deleteCourse,
      studyMaterials,
      addStudyMaterial,
      deleteStudyMaterial,
      activeSearchQuery,
      activeSearchCourse,
      openSearchTheme,
      isHydrated,
    }),
    [
      calendarItems,
      customPerformance,
      customSummaries,
      customTasks,
      desiredCourse,
      deleteCalendarItem,
      deleteTask,
      deleteStudyMaterial,
      courseCatalog,
      courseKnowledge,
      studyMaterials,
      activeSearchCourse,
      activeSearchQuery,
      isHydrated,
      recentSearches,
      savedArticleIds,
      addStudyMaterial,
      updateCalendarItem,
      updateTask,
    ]
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);

  if (!context) {
    throw new Error('useStudy must be used within StudyProvider');
  }

  return context;
}

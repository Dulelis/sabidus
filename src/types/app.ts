export type TabKey = 'Inicio' | 'Pesquisar' | 'Agenda' | 'Recursos' | 'Conta';

export type DiscoveryMode =
  | 'general'
  | 'scientific-articles'
  | 'academic-research'
  | 'channels'
  | 'work-models';

export type HighlightTopic = {
  id: string;
  title: string;
  type: string;
  meta: string;
  course: string;
};

export type Article = {
  id: string;
  title: string;
  category: string;
  course: string;
  description: string;
  source: string;
  duration: string;
  body: string;
  author: string;
  authorBio: string;
  year: string;
};

export type ResearchSource = {
  name: string;
  type: string;
};

export type AgendaItem = {
  day: string;
  focus: string;
  time: string;
};

export type AccountStat = {
  label: string;
  value: string;
};

export type CourseOption = {
  id: string;
  label: string;
};

export type CourseKnowledge = {
  courseId: string;
  courseLabel: string;
  overview: string;
  focusAreas: string[];
  relatedTerms: string[];
  suggestedPaths: string[];
};

export type StudyMaterial = {
  id: string;
  title: string;
  kind: 'arquivo' | 'arquivo-externo' | 'link' | 'camera';
  url: string;
  mimeType: string;
  storageMode: 'session' | 'persisted';
  addedAt: string;
};

export type WeeklySlot = {
  day: string;
  subject: string;
  time: string;
};

export type AssessmentItem = {
  id: string;
  title: string;
  subject: string;
  type: 'Prova' | 'Trabalho' | 'Estudo';
  color: string;
  dueDate: string;
};

export type ResourceModule = {
  id: string;
  title: string;
  summary: string;
  status: string;
};

export type VideoLesson = {
  id: string;
  title: string;
  creator: string;
  creatorBio: string;
  platform: string;
  course: string;
  year: string;
  url: string;
};

export type StudyMethod = {
  id: string;
  title: string;
  description: string;
  howItWorks: string;
};

export type FormulaGuide = {
  id: string;
  title: string;
  area: string;
  explanation: string;
};

export type BookSuggestion = {
  id: string;
  title: string;
  author: string;
  authorBio: string;
  year: string;
  course: string;
};

export type SummaryNote = {
  id: string;
  subject: string;
  summary: string;
  openQuestions: string;
};

export type PerformanceEntry = {
  subject: string;
  grade: string;
  status: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  priority: 'Alta' | 'Media' | 'Baixa';
};

export type SimulatedExam = {
  id: string;
  title: string;
  course: string;
  questionCount: string;
  focus: string;
};

export type EnemTopic = {
  id: string;
  subject: string;
  branch: string;
  summary: string;
};

export type UnifiedSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  routeType: 'article' | 'resource' | 'tab' | 'external' | 'web-result' | 'none';
  routeId?: string;
  routeParams?: Record<string, string>;
  routeUrl?: string;
  sourceDomain?: string;
};

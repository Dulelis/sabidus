import type {
  AccountStat,
  AgendaItem,
  Article,
  CourseOption,
  AssessmentItem,
  BookSuggestion,
  FormulaGuide,
  HighlightTopic,
  NotificationItem,
  PerformanceEntry,
  ResearchSource,
  ResourceModule,
  SimulatedExam,
  StudyMethod,
  SummaryNote,
  TabKey,
  VideoLesson,
  WeeklySlot,
  EnemTopic,
} from '../types/app';

export const tabs: TabKey[] = ['Inicio', 'Pesquisar', 'Agenda', 'Recursos', 'Conta'];

export const highlightTopics: HighlightTopic[] = [
  {
    id: 'citologia-iniciantes',
    title: 'Biologia com Samuel Cunha',
    type: 'Aula em destaque',
    meta: '45 min | Citologia e ecologia',
    course: 'Biologia',
  },
  {
    id: 'plano-estudos-eficiente',
    title: 'Estudo intercalado',
    type: 'Tecnica de estudo',
    meta: 'Pratica guiada para revisar melhor',
    course: 'Pedagogia',
  },
];

export const discoveries = [
  'Artigos cientificos',
  'Pesquisas academicas',
  'Canais para assistir',
  'Modelos de trabalhos',
];

export const courses: CourseOption[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pedagogia', label: 'Pedagogia' },
  { id: 'matematica', label: 'Matematica' },
  { id: 'filosofia', label: 'Filosofia' },
  { id: 'biologia', label: 'Biologia' },
  { id: 'educacao fisica', label: 'Educacao Fisica' },
];

export const articles: Article[] = [
  {
    id: 'plano-estudos-eficiente',
    title: 'Como montar um plano de estudos eficiente',
    category: 'Metodologia',
    course: 'Pedagogia',
    description: 'Guia rapido para rotina semanal, revisoes e prioridades.',
    source: 'Revista de aprendizagem',
    duration: '12 min de leitura',
    author: 'Marina Tavares',
    authorBio: 'Pesquisadora em didatica e organizacao da aprendizagem.',
    year: '2024',
    body:
      'Este material organiza uma rotina pratica de estudo com ciclos curtos, metas claras e revisoes semanais. A proposta ajuda estudantes de licenciatura e educacao a planejar leituras, registrar duvidas e transformar teoria em pratica de sala.',
  },
  {
    id: 'sistemas-medidas',
    title: 'Resumo de sistemas de medidas',
    category: 'Matematica',
    course: 'Matematica',
    description: 'Conceitos centrais para exercicios e conversoes.',
    source: 'Caderno de exatas',
    duration: '18 min de leitura',
    author: 'Renato Alves',
    authorBio: 'Professor de matematica com foco em resolucao guiada de exercicios.',
    year: '2025',
    body:
      'O conteudo revisa unidades, conversoes e aplicacoes em problemas cotidianos. Tambem sugere uma sequencia de exercicios com dificuldade progressiva para fortalecer o raciocinio numerico.',
  },
  {
    id: 'citologia-iniciantes',
    title: 'Citologia basica para iniciantes',
    category: 'Biologia',
    course: 'Biologia',
    description: 'Introducao visual sobre organelas e funcoes celulares.',
    source: 'Atlas de ciencias naturais',
    duration: '14 min de leitura',
    author: 'Samuel Cunha',
    authorBio: 'Educador de ciencias e divulgador de biologia para vestibulares.',
    year: '2025',
    body:
      'A introducao apresenta as principais estruturas celulares, compara celulas eucariontes e procariontes e indica como montar um mapa mental para memorizacao.',
  },
  {
    id: 'filosofia-etica-classica',
    title: 'Etica classica e pensamento filosofico',
    category: 'Filosofia',
    course: 'Filosofia',
    description: 'Panorama inicial sobre virtude, razao e vida em sociedade.',
    source: 'Caderno de humanidades',
    duration: '16 min de leitura',
    author: 'Helena Duarte',
    authorBio: 'Professora de filosofia com pesquisa em etica e teoria politica.',
    year: '2023',
    body:
      'O material conecta autores classicos a debates contemporaneos, sugerindo perguntas de pesquisa e trilhas de leitura para trabalhos academicos.',
  },
  {
    id: 'educacao-fisica-planejamento',
    title: 'Planejamento de aulas em educacao fisica',
    category: 'Educacao Fisica',
    course: 'Educacao Fisica',
    description: 'Sugestoes de sequencias, objetivos e praticas corporais para o ensino.',
    source: 'Caderno de licenciatura',
    duration: '15 min de leitura',
    author: 'Luciana Mendes',
    authorBio: 'Docente da area de movimento, jogos cooperativos e pratica escolar.',
    year: '2025',
    body:
      'O conteudo apresenta planejamento por objetivos, organizacao de atividades motoras, avaliacao formativa e ideias para adaptar aulas de educacao fisica a diferentes turmas.',
  },
];

export const researchSources: ResearchSource[] = [
  { name: 'Google Scholar', type: 'Artigos academicos' },
  { name: 'SciELO', type: 'Pesquisas em portugues' },
  { name: 'PubMed', type: 'Saude e biociencias' },
];

export const agenda: AgendaItem[] = [
  { day: 'Seg', focus: 'Sistemas de medidas', time: '19:00' },
  { day: 'Qua', focus: 'Revisao de matematica', time: '20:00' },
  { day: 'Qui', focus: 'Leitura de artigo', time: '18:30' },
  { day: 'Sex', focus: 'TV oficina biologia', time: '19:30' },
];

export const tasks = [
  'Estudar para mat',
  'Ler um artigo de biologia',
  'Montar resumo da semana',
];

export const accountStats: AccountStat[] = [
  { label: 'Pontos', value: '2480' },
  { label: 'Sequencia', value: '12 dias' },
  { label: 'Nivel', value: 'Pro' },
];

export const weeklySchedule: WeeklySlot[] = [
  { day: 'Seg', subject: 'Matematica | Conjuntos numericos', time: '19:00 - 20:30' },
  { day: 'Ter', subject: 'Pedagogia | Praticas inclusivas', time: '18:30 - 20:00' },
  { day: 'Qua', subject: 'Biologia | Citologia', time: '19:00 - 20:00' },
  { day: 'Qui', subject: 'Filosofia | Etica classica', time: '20:00 - 21:00' },
];

export const assessments: AssessmentItem[] = [
  {
    id: 'aval-1',
    title: 'Prova de conjuntos numericos',
    subject: 'Matematica',
    type: 'Prova',
    color: '#2563EB',
    dueDate: '24/03/2026',
  },
  {
    id: 'aval-2',
    title: 'Trabalho sobre autores da educacao',
    subject: 'Pedagogia',
    type: 'Trabalho',
    color: '#EA580C',
    dueDate: '27/03/2026',
  },
  {
    id: 'aval-3',
    title: 'Simulado ENEM de ciencias humanas',
    subject: 'Filosofia',
    type: 'Prova',
    color: '#0F766E',
    dueDate: '29/03/2026',
  },
];

export const resourceModules: ResourceModule[] = [
  {
    id: 'videoaulas',
    title: 'Videoaulas gratuitas',
    summary: 'Selecao de canais e plataformas gratuitas por curso e assunto.',
    status: 'Ativo',
  },
  {
    id: 'formulas',
    title: 'Formulas explicadas',
    summary: 'Matematica, quimica e fisica com passo a passo e significado de cada elemento.',
    status: 'Ativo',
  },
  {
    id: 'metodos-estudo',
    title: 'Metodos de estudo',
    summary: 'Pomodoro, estudo intercalado, revisao ativa e outras estrategias.',
    status: 'Ativo',
  },
  {
    id: 'enem',
    title: 'Conteudos do ENEM',
    summary: 'Mapa por materia com ramificacoes e assuntos recorrentes.',
    status: 'Em expansao',
  },
  {
    id: 'simulados',
    title: 'Simulados e cronogramas',
    summary: 'Simulados prontos e cronogramas personalizados com apoio de IA.',
    status: 'Ativo',
  },
  {
    id: 'calculadoras',
    title: 'Calculadoras academicas',
    summary: 'Calculadora simples, media escolar e outras utilidades para estudo.',
    status: 'Ativo',
  },
  {
    id: 'duvidas-ia',
    title: 'IA para tirar duvidas',
    summary: 'Ajuda guiada para partes do conteudo que o aluno nao entendeu.',
    status: 'Ativo',
  },
  {
    id: 'cronograma-ia',
    title: 'Cronograma personalizado',
    summary: 'Planejamento semanal baseado em tempo disponivel, materia e metodo.',
    status: 'Ativo',
  },
  {
    id: 'escrita',
    title: 'Correcao de texto e plagio',
    summary: 'Espaco para revisar texto, gramática e orientacoes de originalidade.',
    status: 'Ativo',
  },
];

export const videoLessons: VideoLesson[] = [
  {
    id: 'video-1',
    title: 'Citologia do zero',
    creator: 'Samuel Cunha',
    creatorBio: 'Professor de biologia com foco em vestibulares e revisao visual.',
    platform: 'YouTube',
    course: 'Biologia',
    year: '2025',
  },
  {
    id: 'video-2',
    title: 'Didatica e planejamento docente',
    creator: 'Canal Professora Clara',
    creatorBio: 'Canal voltado a pedagogia, educacao inclusiva e pratica docente.',
    platform: 'YouTube',
    course: 'Pedagogia',
    year: '2024',
  },
  {
    id: 'video-3',
    title: 'Filosofia para iniciantes',
    creator: 'Instituto Humanidades',
    creatorBio: 'Projeto de divulgacao academica com introducoes acessiveis a filosofia.',
    platform: 'Plataforma aberta',
    course: 'Filosofia',
    year: '2023',
  },
  {
    id: 'video-4',
    title: 'Jogos, movimento e planejamento em educacao fisica',
    creator: 'Canal Corpo em Aula',
    creatorBio: 'Conteudo voltado a planejamento de aulas, jogos cooperativos e pratica corporal escolar.',
    platform: 'YouTube',
    course: 'Educacao Fisica',
    year: '2025',
  },
];

export const studyMethods: StudyMethod[] = [
  {
    id: 'pomodoro',
    title: 'Tecnica Pomodoro',
    description: 'Blocos de foco com pausas curtas para manter constancia.',
    howItWorks: 'Estude por 25 minutos, pause 5, e repita o ciclo com revisoes ao final.',
  },
  {
    id: 'revisao-ativa',
    title: 'Revisao ativa',
    description: 'Metodo para testar memoria e reforcar o aprendizado.',
    howItWorks: 'Feche o material, recite o que lembra, anote lacunas e retorne para completar.',
  },
  {
    id: 'estudo-intercalado',
    title: 'Estudo intercalado',
    description: 'Alternancia entre materias para aumentar retencao.',
    howItWorks: 'Misture duas ou tres materias ao longo da semana, evitando longos blocos unicos.',
  },
];

export const formulaGuides: FormulaGuide[] = [
  {
    id: 'bhaskara',
    title: 'Formula de Bhaskara',
    area: 'Matematica',
    explanation: 'Delta identifica o discriminante e mostra quantas raizes a equacao possui.',
  },
  {
    id: 'velocidade-media',
    title: 'Velocidade media',
    area: 'Fisica',
    explanation: 'Relaciona deslocamento e tempo para entender o movimento em problemas basicos.',
  },
  {
    id: 'molaridade',
    title: 'Molaridade',
    area: 'Quimica',
    explanation: 'Mostra a relacao entre numero de mols e volume da solucao.',
  },
];

export const bookSuggestions: BookSuggestion[] = [
  {
    id: 'livro-1',
    title: 'Pedagogia da Autonomia',
    author: 'Paulo Freire',
    authorBio: 'Educador brasileiro reconhecido mundialmente por sua contribuicao a educacao critica.',
    year: '1996',
    course: 'Pedagogia',
  },
  {
    id: 'livro-2',
    title: 'O Mundo de Sofia',
    author: 'Jostein Gaarder',
    authorBio: 'Escritor noruegues conhecido por popularizar a historia da filosofia.',
    year: '1991',
    course: 'Filosofia',
  },
  {
    id: 'livro-3',
    title: 'Fundamentos de Matematica Elementar',
    author: 'Gelson Iezzi',
    authorBio: 'Autor brasileiro de referencia em formacao matematica escolar.',
    year: '2019',
    course: 'Matematica',
  },
  {
    id: 'livro-4',
    title: 'Metodologia do ensino da educacao fisica',
    author: 'Vera Soares',
    authorBio: 'Autora com foco em planejamento didatico, cultura corporal e pratica pedagógica.',
    year: '2022',
    course: 'Educacao Fisica',
  },
];

export const summaryNotes: SummaryNote[] = [
  {
    id: 'resumo-1',
    subject: 'Biologia',
    summary: 'Resumo da aula sobre organelas celulares e diferenca entre celula animal e vegetal.',
    openQuestions: 'Ainda revisar funcao do complexo golgiense e lisossomos.',
  },
  {
    id: 'resumo-2',
    subject: 'Pedagogia',
    summary: 'Anotacoes sobre avaliacao formativa e escuta ativa em sala.',
    openQuestions: 'Aprofundar instrumentos de acompanhamento individual.',
  },
];

export const performanceEntries: PerformanceEntry[] = [
  { subject: 'Matematica', grade: '8.7', status: 'Acima da meta' },
  { subject: 'Biologia', grade: '7.9', status: 'Estavel' },
  { subject: 'Filosofia', grade: '6.8', status: 'Precisa reforco' },
];

export const notifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Trabalho de Pedagogia',
    detail: 'Entrega em 27/03/2026 com prioridade alta.',
    priority: 'Alta',
  },
  {
    id: 'notif-2',
    title: 'Revisar citologia',
    detail: 'Lembrete para concluir o resumo pos-aula hoje.',
    priority: 'Media',
  },
  {
    id: 'notif-3',
    title: 'Simulado ENEM',
    detail: 'Agendado para domingo com foco em ciencias humanas.',
    priority: 'Baixa',
  },
];

export const simulatedExams: SimulatedExam[] = [
  {
    id: 'sim-1',
    title: 'Simulado de pedagogia inclusiva',
    course: 'Pedagogia',
    questionCount: '20 questoes',
    focus: 'Autores, praticas inclusivas e avaliacao.',
  },
  {
    id: 'sim-2',
    title: 'Simulado de conjuntos numericos',
    course: 'Matematica',
    questionCount: '15 questoes',
    focus: 'Conjuntos, intervalos e operacoes.',
  },
  {
    id: 'sim-3',
    title: 'Simulado ENEM filosofia',
    course: 'Filosofia',
    questionCount: '12 questoes',
    focus: 'Etica, politica e pensamento moderno.',
  },
];

export const enemTopics: EnemTopic[] = [
  {
    id: 'enem-1',
    subject: 'Portugues',
    branch: 'Gramatica nominal',
    summary: 'Classes gramaticais, concordancia e analise de estruturas.',
  },
  {
    id: 'enem-2',
    subject: 'Matematica',
    branch: 'Razao, proporcao e porcentagem',
    summary: 'Topicos recorrentes em problemas contextualizados do exame.',
  },
  {
    id: 'enem-3',
    subject: 'Biologia',
    branch: 'Ecologia e citologia',
    summary: 'Assuntos frequentes ligados a meio ambiente e estruturas celulares.',
  },
];

export const studentProfile = {
  name: 'Arielle Student',
  handle: '@webschool.pro',
  course: 'Pedagogia',
  institution: 'Instituicao Academica Central',
  registration: 'MAT-2026-0042',
  portalAccess: 'portal.academico.edu',
};

export function findArticleById(id: string) {
  return articles.find((article) => article.id === id);
}

export function findResourceModuleById(id: string) {
  return resourceModules.find((item) => item.id === id);
}

import type { CourseKnowledge } from '@/types/app';

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function buildCourseId(label: string) {
  const normalized = normalizeText(label).replace(/[^a-z0-9]+/g, '-');
  return normalized.replace(/^-+|-+$/g, '') || `curso-${Date.now()}`;
}

const courseKnowledgeTemplates: Record<
  string,
  Omit<CourseKnowledge, 'courseId' | 'courseLabel'>
> = {
  pedagogia: {
    overview:
      'Pedagogia aprofunda aprendizagem, didatica, avaliacao, planejamento escolar e desenvolvimento humano em contextos educativos.',
    focusAreas: [
      'Didatica, metodologia e planejamento de aula',
      'Avaliacao formativa e acompanhamento do estudante',
      'Politicas educacionais, inclusao e gestao escolar',
    ],
    relatedTerms: ['didatica', 'avaliacao', 'curriculo', 'educacao inclusiva'],
    suggestedPaths: [
      'Abrir artigos de metodologia e didatica',
      'Explorar correcao de texto para trabalhos academicos',
      'Montar cronograma com foco em leitura e revisao ativa',
    ],
  },
  matematica: {
    overview:
      'Matematica exige base conceitual forte, pratica constante de exercicios e interpretacao de problemas em diferentes contextos.',
    focusAreas: [
      'Algebra, funcoes e conjuntos numericos',
      'Geometria, medidas e proporcionalidade',
      'Resolucao guiada de exercicios e revisao de formulas',
    ],
    relatedTerms: ['algebra', 'funcoes', 'geometria', 'porcentagem'],
    suggestedPaths: [
      'Entrar em formulas explicadas e calculadoras',
      'Separar blocos de exercicios por nivel de dificuldade',
      'Usar simulados para consolidar raciocinio numerico',
    ],
  },
  filosofia: {
    overview:
      'Filosofia trabalha leitura, comparacao de autores, interpretacao de ideias e construcao de argumentos em textos e debates.',
    focusAreas: [
      'Etica, politica e historia da filosofia',
      'Leitura de autores classicos e contemporaneos',
      'Argumentacao escrita e repertorio teorico',
    ],
    relatedTerms: ['etica', 'politica', 'autores', 'argumentacao'],
    suggestedPaths: [
      'Buscar artigos por autor ou corrente filosofica',
      'Registrar resumos e duvidas por texto estudado',
      'Usar a revisao de escrita para ensaios e resenhas',
    ],
  },
  biologia: {
    overview:
      'Biologia combina memorizacao estruturada, observacao de processos naturais e aplicacao em temas como citologia, ecologia e fisiologia.',
    focusAreas: [
      'Citologia, genetica e ecologia',
      'Mapas mentais para estruturas e processos',
      'Interpretacao de imagens, tabelas e situacoes-problema',
    ],
    relatedTerms: ['citologia', 'ecologia', 'genetica', 'fisiologia'],
    suggestedPaths: [
      'Abrir videoaulas e resumos para reforco visual',
      'Montar revisoes curtas por sistema ou tema',
      'Salvar duvidas pontuais para explicacao guiada',
    ],
  },
  'educacao fisica': {
    overview:
      'Educacao Fisica envolve planejamento de aulas, cultura corporal, desenvolvimento motor, jogos, esportes e pratica pedagogica.',
    focusAreas: [
      'Planejamento de aulas e sequencias didaticas',
      'Jogos cooperativos, esportes e movimento corporal',
      'Avaliacao, inclusao e pratica pedagogica escolar',
    ],
    relatedTerms: ['movimento', 'esporte', 'jogos', 'planejamento corporal'],
    suggestedPaths: [
      'Abrir videoaulas sobre pratica corporal e jogos',
      'Ler materiais de planejamento e metodologia',
      'Criar cronograma com foco em leitura, observacao e pratica',
    ],
  },
};

export function generateCourseKnowledge(courseLabel: string): CourseKnowledge {
  const normalized = normalizeText(courseLabel);
  const template = courseKnowledgeTemplates[normalized];

  if (template) {
    return {
      courseId: buildCourseId(courseLabel),
      courseLabel,
      ...template,
    };
  }

  return {
    courseId: buildCourseId(courseLabel),
    courseLabel,
    overview: `${courseLabel} pode ser estudado por trilhas de fundamentos, aplicacoes praticas, leitura orientada e revisoes progressivas para consolidar repertorio.`,
    focusAreas: [
      `Fundamentos centrais de ${courseLabel}`,
      `Aplicacoes praticas e temas recorrentes em ${courseLabel}`,
      `Revisao ativa com resumos, exercicios e comparacao de conceitos`,
    ],
    relatedTerms: [
      courseLabel,
      `introducao a ${courseLabel}`,
      `${courseLabel} aplicado`,
      `${courseLabel} revisao`,
    ],
    suggestedPaths: [
      `Pesquisar artigos introdutorios sobre ${courseLabel}`,
      `Abrir a pesquisa aprofundada com links e videos de ${courseLabel}`,
      `Montar um cronograma de estudo focado em ${courseLabel}`,
    ],
  };
}

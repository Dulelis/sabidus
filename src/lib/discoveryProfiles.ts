import type { DiscoveryMode } from '@/types/app';

export type DiscoveryFilterOption = {
  id: string;
  label: string;
  promptText: string;
};

export type DiscoveryProfile = {
  mode: DiscoveryMode;
  label: string;
  summary: string;
  defaultQuery: string;
  sourcesTitle: string;
  videosTitle: string;
  filters: DiscoveryFilterOption[];
};

const discoveryProfiles: Record<DiscoveryMode, DiscoveryProfile> = {
  general: {
    mode: 'general',
    label: 'Busca geral',
    summary: 'Cruza o tema com materiais, fontes da web, videos e recursos do app.',
    defaultQuery: 'tema de estudo',
    sourcesTitle: 'Fontes iniciais da web',
    videosTitle: 'Videos encontrados na web',
    filters: [],
  },
  'scientific-articles': {
    mode: 'scientific-articles',
    label: 'Artigos cientificos',
    summary:
      'Prioriza SciELO, Google Academico, Portal de Periodicos CAPES e PubMed/MEDLINE, evitando Wikipedia e blogs.',
    defaultQuery: 'artigos cientificos',
    sourcesTitle: 'Artigos cientificos filtrados',
    videosTitle: 'Videos complementares',
    filters: [
      {
        id: 'tema-central',
        label: 'Tema central',
        promptText: 'reduza a busca ao nucleo exato do tema e evite desviar para assuntos laterais',
      },
      {
        id: 'ultimos-5-anos',
        label: 'Ultimos 5 anos',
        promptText: 'priorize resultados publicados ou atualizados nos ultimos 5 anos',
      },
      {
        id: 'revisoes',
        label: 'Revisoes',
        promptText: 'prefira revisoes sistematicas, revisoes narrativas ou estados da arte',
      },
      {
        id: 'sem-blogs',
        label: 'Sem blogs',
        promptText: 'ignore wikipedia, blogs, foruns e paginas sem carater academico',
      },
    ],
  },
  'academic-research': {
    mode: 'academic-research',
    label: 'Pesquisas academicas',
    summary:
      'Rastreia linhas de pesquisa, autores, recortes metodologicos e estudos recentes da area.',
    defaultQuery: 'pesquisas academicas',
    sourcesTitle: 'Pesquisas e estudos da area',
    videosTitle: 'Palestras e videos de apoio',
    filters: [
      {
        id: 'estado-da-arte',
        label: 'Estado da arte',
        promptText: 'mapeie o estado da arte, principais tendencias e lacunas da area',
      },
      {
        id: 'autores-chave',
        label: 'Autores-chave',
        promptText: 'priorize autores, grupos de pesquisa e referencias recorrentes',
      },
      {
        id: 'aplicadas',
        label: 'Aplicadas',
        promptText: 'destaque pesquisas aplicadas, estudos de caso e evidencias praticas',
      },
      {
        id: 'sem-blogs',
        label: 'Sem blogs',
        promptText: 'ignore wikipedia, blogs, foruns e paginas sem carater academico',
      },
    ],
  },
  channels: {
    mode: 'channels',
    label: 'Canais para assistir',
    summary:
      'Lista canais, playlists e videoaulas realmente ligados ao tema e ao curso escolhido.',
    defaultQuery: 'videoaulas',
    sourcesTitle: 'Canais e playlists recomendados',
    videosTitle: 'Videos e aulas do tema',
    filters: [
      {
        id: 'aulas-completas',
        label: 'Aulas completas',
        promptText: 'prefira aulas completas, playlists organizadas e series de estudo',
      },
      {
        id: 'revisao-rapida',
        label: 'Revisao rapida',
        promptText: 'inclua videos curtos de revisao ou resumo quando forem bem avaliados',
      },
      {
        id: 'canais-br',
        label: 'Canais BR',
        promptText: 'priorize canais em portugues do Brasil quando houver boa cobertura do tema',
      },
    ],
  },
  'work-models': {
    mode: 'work-models',
    label: 'Modelos de trabalhos',
    summary:
      'Relaciona resenhas, artigos, seminarios, projetos e outros formatos de trabalho ligados ao assunto.',
    defaultQuery: 'modelos de trabalhos',
    sourcesTitle: 'Modelos e referencias de trabalhos',
    videosTitle: 'Videos de orientacao',
    filters: [
      {
        id: 'artigo',
        label: 'Artigo',
        promptText: 'inclua exemplos e referencias uteis para artigo academico',
      },
      {
        id: 'resenha',
        label: 'Resenha',
        promptText: 'inclua exemplos e referencias uteis para resenha critica',
      },
      {
        id: 'seminario',
        label: 'Seminario',
        promptText: 'inclua formatos e referencias uteis para seminario ou apresentacao',
      },
      {
        id: 'tcc-projeto',
        label: 'TCC/projeto',
        promptText: 'inclua ideias e estruturas uteis para projeto, pre-projeto ou TCC',
      },
    ],
  },
};

export function getDiscoveryProfile(mode?: string): DiscoveryProfile {
  const normalizedMode = (mode || '').trim() as DiscoveryMode;

  return discoveryProfiles[normalizedMode] || discoveryProfiles.general;
}

export function parseDiscoveryFilters(value?: string | string[]): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap((item) => parseDiscoveryFilters(item))));
  }

  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function serializeDiscoveryFilters(filters: string[]) {
  return filters
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',');
}

export function buildDiscoveryFallbackQuery(
  mode: DiscoveryMode,
  options: {
    currentQuery?: string;
    desiredCourse?: string;
    selectedCourseLabel?: string;
  }
) {
  const normalizedQuery = options.currentQuery?.trim();

  if (normalizedQuery) {
    return normalizedQuery;
  }

  const normalizedCourseLabel = options.selectedCourseLabel?.trim();

  if (normalizedCourseLabel) {
    return normalizedCourseLabel;
  }

  const normalizedDesiredCourse = options.desiredCourse?.trim();

  if (normalizedDesiredCourse) {
    return normalizedDesiredCourse;
  }

  return discoveryProfiles[mode].defaultQuery;
}

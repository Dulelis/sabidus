import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('./.env', import.meta.url));
const appConfigPath = fileURLToPath(new URL('../app.json', import.meta.url));
dotenv.config({ path: envPath });

const app = express();
const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

app.use(cors());
app.use(express.json());

function parseModelJson(outputText, contextLabel) {
  const trimmedOutput = outputText.trim();
  const withoutFence = trimmedOutput
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const firstBrace = withoutFence.indexOf('{');
    const lastBrace = withoutFence.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error(`${contextLabel} returned invalid JSON`);
    }

    return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
  }
}

function normalizeStringList(value, limit = 10) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

const discoveryProfiles = {
  general: {
    label: 'busca geral',
    promptInstruction:
      'Equilibre referencias da web, explicacao inicial, consultas uteis e material de aprofundamento.',
    allowedDomains: [],
    priorityDomains: [],
    blockedPatterns: ['wikipedia.org', 'blogspot.', 'wordpress.', 'medium.com'],
    queryInstruction:
      'As consultas devem cobrir explicacao do tema, referencia inicial e aprofundamento pratico.',
  },
  'scientific-articles': {
    label: 'artigos cientificos',
    promptInstruction:
      'Priorize artigos cientificos, revisoes e paginas de indexadores academicos. Dê preferencia para SciELO, Google Academico, Portal de Periodicos CAPES e PubMed/MEDLINE. Nao use Wikipedia, blogs, foruns ou paginas promocionais.',
    allowedDomains: [
      'scielo.br',
      'scholar.google.com',
      'periodicos.capes.gov.br',
      'pubmed.ncbi.nlm.nih.gov',
      'ncbi.nlm.nih.gov',
      'doi.org',
      'nih.gov',
      'springer.com',
      'sciencedirect.com',
      'wiley.com',
      'nature.com',
      '.edu',
      '.gov',
      '.gov.br',
    ],
    priorityDomains: [
      'scielo.br',
      'scholar.google.com',
      'periodicos.capes.gov.br',
      'pubmed.ncbi.nlm.nih.gov',
      'ncbi.nlm.nih.gov',
    ],
    blockedPatterns: ['wikipedia.org', 'blogspot.', 'wordpress.', 'medium.com', '/blog/'],
    queryInstruction:
      'As consultas devem ficar mais fechadas e, quando fizer sentido, incluir bases como SciELO, Google Academico, CAPES ou PubMed.',
    filterPrompts: {
      'tema-central': 'mantenha foco estrito no nucleo central do tema e descarte assuntos paralelos',
      'ultimos-5-anos': 'priorize resultados recentes, preferencialmente dos ultimos 5 anos',
      revisoes: 'prefira revisoes, estados da arte e sinteses academicas',
      'sem-blogs': 'ignore wikipedia, blogs, foruns e conteudos sem curadoria academica',
    },
  },
  'academic-research': {
    label: 'pesquisas academicas',
    promptInstruction:
      'Rastreie pesquisas academicas da area, linhas de investigacao, autores, lacunas e estudos aplicados. Priorize fontes academicas ou institucionais e evite Wikipedia e blogs.',
    allowedDomains: [
      'scielo.br',
      'scholar.google.com',
      'periodicos.capes.gov.br',
      'pubmed.ncbi.nlm.nih.gov',
      'ncbi.nlm.nih.gov',
      'doi.org',
      'nih.gov',
      'springer.com',
      'sciencedirect.com',
      'wiley.com',
      'nature.com',
      '.edu',
      '.gov',
      '.gov.br',
      'repositorio',
    ],
    priorityDomains: [
      'periodicos.capes.gov.br',
      'scielo.br',
      'scholar.google.com',
      'pubmed.ncbi.nlm.nih.gov',
    ],
    blockedPatterns: ['wikipedia.org', 'blogspot.', 'wordpress.', 'medium.com', '/blog/'],
    queryInstruction:
      'As consultas devem mapear estado da arte, autores-chave, metodologias e pesquisas aplicadas da area.',
    filterPrompts: {
      'estado-da-arte': 'procure estados da arte, revisoes e mapeamentos da literatura',
      'autores-chave': 'destaque autores recorrentes, grupos e referencias influentes',
      aplicadas: 'destaque pesquisas aplicadas, evidencias praticas e estudos de caso',
      'sem-blogs': 'ignore wikipedia, blogs, foruns e paginas sem carater academico',
    },
  },
  channels: {
    label: 'canais para assistir',
    promptInstruction:
      'Liste canais, playlists e videoaulas sobre o assunto, priorizando canais confiaveis, educativos e diretamente ligados ao tema.',
    allowedDomains: ['youtube.com', 'youtu.be', 'vimeo.com'],
    priorityDomains: ['youtube.com', 'youtu.be'],
    blockedPatterns: ['wikipedia.org', 'blogspot.', 'wordpress.', 'medium.com'],
    queryInstruction:
      'As consultas devem focar em canais, playlists, aulas completas e revisoes em video sobre o tema.',
    filterPrompts: {
      'aulas-completas': 'prefira playlists, series ou aulas completas sobre o tema',
      'revisao-rapida': 'inclua videos curtos de revisao quando forem realmente uteis',
      'canais-br': 'priorize canais em portugues do Brasil quando houver boa cobertura',
    },
  },
  'work-models': {
    label: 'modelos de trabalhos',
    promptInstruction:
      'Relacione referencias, exemplos e formatos de trabalhos ligados ao assunto, como artigo, resenha, seminario, projeto ou TCC. Priorize materiais institucionais, academicos e orientacoes formais.',
    allowedDomains: [
      'periodicos.capes.gov.br',
      'scielo.br',
      'scholar.google.com',
      'doi.org',
      '.edu',
      '.gov',
      '.gov.br',
      'repositorio',
    ],
    priorityDomains: ['periodicos.capes.gov.br', 'scielo.br', 'scholar.google.com', '.edu'],
    blockedPatterns: ['wikipedia.org', 'blogspot.', 'wordpress.', 'medium.com'],
    queryInstruction:
      'As consultas devem focar em referencias de trabalhos, estrutura de genero academico e exemplos ligados ao tema.',
    filterPrompts: {
      artigo: 'inclua exemplos ou referencias para artigo academico',
      resenha: 'inclua exemplos ou referencias para resenha critica',
      seminario: 'inclua exemplos ou referencias para seminario ou apresentacao',
      'tcc-projeto': 'inclua exemplos ou referencias para projeto, pre-projeto ou TCC',
    },
  },
};

function normalizeDiscoveryMode(value) {
  const normalizedValue = typeof value === 'string' ? value.trim().toLowerCase() : '';

  return discoveryProfiles[normalizedValue] ? normalizedValue : 'general';
}

function getDiscoveryProfile(mode) {
  return discoveryProfiles[normalizeDiscoveryMode(mode)];
}

function normalizeFilterIds(value) {
  return normalizeStringList(value, 8).map((item) => item.toLowerCase());
}

function buildFilterPrompt(profile, filterIds) {
  if (!profile.filterPrompts) {
    return '';
  }

  return filterIds
    .map((filterId) => profile.filterPrompts?.[filterId])
    .filter(Boolean)
    .join('; ');
}

function parseHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function formatSourceDomain(url) {
  const hostname = parseHostname(url);

  if (!hostname) {
    return '';
  }

  return hostname.replace(/^www\./, '');
}

function truncateText(value, limit = 260) {
  const normalizedValue = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue.length <= limit) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, limit - 1).trim()}...`;
}

function matchesDomain(hostname, domainPattern) {
  const normalizedPattern = domainPattern.toLowerCase();

  if (!hostname || !normalizedPattern) {
    return false;
  }

  if (normalizedPattern.startsWith('.')) {
    return hostname.endsWith(normalizedPattern);
  }

  return hostname === normalizedPattern || hostname.endsWith(`.${normalizedPattern}`);
}

function isBlockedSource(url, profile) {
  const normalizedUrl = url.toLowerCase();

  return profile.blockedPatterns.some((pattern) => normalizedUrl.includes(pattern));
}

function isAllowedSource(url, profile) {
  if (!profile.allowedDomains.length) {
    return true;
  }

  const hostname = parseHostname(url);

  return profile.allowedDomains.some((domainPattern) => matchesDomain(hostname, domainPattern));
}

function getPriorityScore(url, profile) {
  const hostname = parseHostname(url);
  let score = 0;

  for (const domainPattern of profile.priorityDomains) {
    if (matchesDomain(hostname, domainPattern)) {
      score += 5;
    }
  }

  for (const domainPattern of profile.allowedDomains) {
    if (matchesDomain(hostname, domainPattern)) {
      score += 1;
    }
  }

  if (/youtube|youtu\.be|vimeo/i.test(url)) {
    score += 2;
  }

  return score;
}

function buildGroundedSources(groundingMetadata, discoveryProfile) {
  const chunks = Array.isArray(groundingMetadata?.groundingChunks)
    ? groundingMetadata.groundingChunks
    : [];
  const supports = Array.isArray(groundingMetadata?.groundingSupports)
    ? groundingMetadata.groundingSupports
    : [];
  const sourceMap = new Map();

  for (const chunk of chunks) {
    const uri = chunk?.web?.uri?.trim();
    const title = chunk?.web?.title?.trim();

    if (!uri || sourceMap.has(uri)) {
      continue;
    }

    sourceMap.set(uri, {
      title: title || uri,
      url: uri,
      domain: formatSourceDomain(uri),
      snippets: new Set(),
    });
  }

  for (const support of supports) {
    const snippet = truncateText(support?.segment?.text);
    const chunkIndices = Array.isArray(support?.groundingChunkIndices)
      ? support.groundingChunkIndices
      : [];

    if (!snippet || chunkIndices.length === 0) {
      continue;
    }

    for (const chunkIndex of chunkIndices) {
      const groundedChunk = chunks?.[chunkIndex];
      const uri = groundedChunk?.web?.uri?.trim();

      if (!uri) {
        continue;
      }

      const source = sourceMap.get(uri);

      if (!source) {
        continue;
      }

      source.snippets.add(snippet);
    }
  }

  const uniqueSources = Array.from(sourceMap.values()).map((source) => ({
    title: source.title,
    url: source.url,
    domain: source.domain,
    snippet:
      truncateText(Array.from(source.snippets).join(' '), 320) ||
      'Trecho localizado na web sobre o tema pesquisado.',
  }));

  const filteredSources = uniqueSources
    .filter((source) => !isBlockedSource(source.url, discoveryProfile))
    .filter((source) => isAllowedSource(source.url, discoveryProfile))
    .sort((first, second) =>
      getPriorityScore(second.url, discoveryProfile) -
      getPriorityScore(first.url, discoveryProfile)
    );
  const fallbackSources = uniqueSources
    .filter((source) => !isBlockedSource(source.url, discoveryProfile))
    .sort((first, second) =>
      getPriorityScore(second.url, discoveryProfile) -
      getPriorityScore(first.url, discoveryProfile)
    );

  return filteredSources.length > 0 ? filteredSources : fallbackSources;
}

function getLatestAppVersion() {
  try {
    const appConfig = JSON.parse(readFileSync(appConfigPath, 'utf8'));
    return appConfig?.expo?.version?.trim() || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function getApiKey() {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  return geminiApiKey;
}

async function runJsonPrompt(prompt) {
  const apiKey = getApiKey();
  const response = await fetch(geminiApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || `Gemini request failed with status ${response.status}`;
    throw new Error(message);
  }

  const outputText = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  if (!outputText) {
    throw new Error('Gemini returned an empty response');
  }

  return outputText;
}

async function runGroundedJsonPrompt(prompt) {
  const apiKey = getApiKey();
  const response = await fetch(geminiApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      tools: [
        {
          google_search: {},
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || `Gemini grounded request failed with status ${response.status}`;
    throw new Error(message);
  }

  const outputText = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  if (!outputText) {
    throw new Error('Gemini grounded search returned an empty response');
  }

  return {
    outputText,
    groundingMetadata: data?.candidates?.[0]?.groundingMetadata,
  };
}

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    message: 'SabiduS API online',
    healthcheck: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model,
    provider: 'gemini',
    configured: Boolean(geminiApiKey),
  });
});

app.get('/api/app-update', (_req, res) => {
  res.json({
    ok: true,
    latestVersion: getLatestAppVersion(),
    downloadUrl: process.env.APP_UPDATE_URL?.trim() || '',
    releaseNotes: process.env.APP_UPDATE_NOTES?.trim() || '',
    publishedAt: process.env.APP_UPDATE_PUBLISHED_AT?.trim() || '',
    isRequired: process.env.APP_UPDATE_REQUIRED === 'true',
  });
});

app.post('/api/explain', async (req, res) => {
  try {
    const { subject = '', question = '' } = req.body ?? {};
    const prompt = `Voce e um tutor academico. Responda em JSON valido com a chave "tips" contendo um array de exatamente 3 strings curtas em portugues do Brasil. Materia: ${subject}. Duvida: ${question}.`;
    const output = await runJsonPrompt(prompt);
    const parsed = parseModelJson(output, 'Explain route');
    res.json(parsed);
  } catch (error) {
    res.status(500).json({
      error: 'explain_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/review', async (req, res) => {
  try {
    const { text = '' } = req.body ?? {};
    const prompt = `Voce e um revisor de escrita academica. Analise o texto abaixo e responda em JSON valido com as chaves "issues" (array de strings), "revisedPreview" (string) e "plagiarismNote" (string). Texto: ${text}`;
    const output = await runJsonPrompt(prompt);
    const parsed = parseModelJson(output, 'Review route');
    res.json(parsed);
  } catch (error) {
    res.status(500).json({
      error: 'review_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/study-plan', async (req, res) => {
  try {
    const {
      availableDays = '',
      hoursPerDay = '',
      method = '',
      objective = '',
    } = req.body ?? {};

    const prompt = `Voce e um planejador de estudos. Responda em JSON valido com a chave "items", contendo um array de objetos com "day" e "plan". Gere um cronograma em portugues do Brasil com base em: dias disponiveis ${availableDays}, horas por dia ${hoursPerDay}, metodo ${method}, objetivo ${objective}.`;
    const output = await runJsonPrompt(prompt);
    const parsed = parseModelJson(output, 'Study plan route');
    res.json(parsed);
  } catch (error) {
    res.status(500).json({
      error: 'study_plan_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/deep-search', async (req, res) => {
  try {
    const {
      theme = '',
      course = '',
      mode = 'general',
      filters = [],
      courseOverview = '',
      focusAreas = [],
      relatedTerms = [],
    } = req.body ?? {};
    const normalizedTheme = theme.trim();
    const normalizedCourse = course.trim();
    const normalizedMode = normalizeDiscoveryMode(mode);
    const discoveryProfile = getDiscoveryProfile(normalizedMode);
    const normalizedFilters = normalizeFilterIds(filters);
    const filtersPrompt = buildFilterPrompt(discoveryProfile, normalizedFilters);
    const normalizedCourseOverview = courseOverview.trim();
    const normalizedFocusAreas = normalizeStringList(focusAreas, 6);
    const normalizedRelatedTerms = normalizeStringList(relatedTerms, 8);

    if (!normalizedTheme) {
      res.status(400).json({
        error: 'deep_search_failed',
        message: 'Theme is required',
      });
      return;
    }

    const prompt = `
Voce e um orientador academico que trabalha dentro de um app de estudos. Use busca na web para montar uma resposta util e objetiva para o aluno.

Responda em JSON valido com estas chaves:
- "summary": string curta em portugues do Brasil explicando o tema
- "whyItMatters": string curta explicando por que esse tema importa para o estudo
- "keyTopics": array com exatamente 5 topicos-chave
- "practicalApplications": array com exatamente 3 aplicacoes praticas
- "tips": array com exatamente 5 dicas praticas
- "nextSteps": array com exatamente 3 proximos passos curtos
- "studyQuestions": array com exatamente 4 perguntas de estudo
- "queryIdeas": array com exatamente 4 consultas de busca mais especificas

Regras:
- Seja especifico e direto.
- Se houver curso informado, adapte o recorte para esse curso.
- Se o tema for amplo, escolha o recorte inicial mais util para o aluno e deixe isso claro.
- Nao invente links no JSON.
- Respeite o modo de descoberta e os filtros ativos.

Tema de estudo: ${normalizedTheme}
Curso relacionado: ${normalizedCourse || 'nao informado'}
Modo de descoberta: ${discoveryProfile.label}
Instrucao do modo: ${discoveryProfile.promptInstruction}
Filtros ativos: ${filtersPrompt || 'nenhum filtro adicional'}
Instrucao para as consultas: ${discoveryProfile.queryInstruction}
Contexto do curso: ${normalizedCourseOverview || 'nao informado'}
Areas de foco do curso: ${normalizedFocusAreas.join('; ') || 'nao informado'}
Termos relacionados do curso: ${normalizedRelatedTerms.join('; ') || 'nao informado'}
`;

    const { outputText, groundingMetadata } = await runGroundedJsonPrompt(prompt);
    const parsed = parseModelJson(outputText, 'Deep search route');

    const finalSources = buildGroundedSources(groundingMetadata, discoveryProfile);
    const videoSources = finalSources.filter((source) =>
      /youtube|youtu\.be|vimeo|video/i.test(source.url)
    );
    const groundedQueries = normalizeStringList(groundingMetadata?.webSearchQueries, 6);
    const promptQueries = normalizeStringList(parsed.queryIdeas, 6);
    const mergedQueries = Array.from(new Set([...promptQueries, ...groundedQueries])).slice(0, 8);

    res.json({
      theme: normalizedTheme,
      course: normalizedCourse,
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      whyItMatters:
        typeof parsed.whyItMatters === 'string' ? parsed.whyItMatters.trim() : '',
      keyTopics: normalizeStringList(parsed.keyTopics, 5),
      practicalApplications: normalizeStringList(parsed.practicalApplications, 3),
      tips: normalizeStringList(parsed.tips, 5),
      nextSteps: normalizeStringList(parsed.nextSteps, 3),
      studyQuestions: normalizeStringList(parsed.studyQuestions, 4),
      webSearchQueries: mergedQueries,
      sources: finalSources.slice(0, 16),
      videos: videoSources.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({
      error: 'deep_search_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(port, host, () => {
  console.log(`SabiduS API running on http://${host}:${port}`);
});

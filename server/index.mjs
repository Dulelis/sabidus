import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('./.env', import.meta.url));
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
      generationConfig: {
        responseMimeType: 'application/json',
      },
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
      courseOverview = '',
      focusAreas = [],
      relatedTerms = [],
    } = req.body ?? {};
    const normalizedTheme = theme.trim();
    const normalizedCourse = course.trim();
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

Tema de estudo: ${normalizedTheme}
Curso relacionado: ${normalizedCourse || 'nao informado'}
Contexto do curso: ${normalizedCourseOverview || 'nao informado'}
Areas de foco do curso: ${normalizedFocusAreas.join('; ') || 'nao informado'}
Termos relacionados do curso: ${normalizedRelatedTerms.join('; ') || 'nao informado'}
`;

    const { outputText, groundingMetadata } = await runGroundedJsonPrompt(prompt);
    const parsed = parseModelJson(outputText, 'Deep search route');

    const chunks = Array.isArray(groundingMetadata?.groundingChunks)
      ? groundingMetadata.groundingChunks
      : [];
    const uniqueSources = [];
    const seenUris = new Set();

    for (const chunk of chunks) {
      const uri = chunk?.web?.uri?.trim();
      const title = chunk?.web?.title?.trim();

      if (!uri || seenUris.has(uri)) {
        continue;
      }

      seenUris.add(uri);
      uniqueSources.push({
        title: title || uri,
        url: uri,
      });
    }

    const videoSources = uniqueSources.filter((source) =>
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
      sources: uniqueSources.slice(0, 10),
      videos: videoSources.slice(0, 6),
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

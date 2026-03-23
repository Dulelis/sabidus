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
    const parsed = JSON.parse(output);
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
    const parsed = JSON.parse(output);
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
    const parsed = JSON.parse(output);
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
    const { theme = '' } = req.body ?? {};
    const normalizedTheme = theme.trim();

    if (!normalizedTheme) {
      res.status(400).json({
        error: 'deep_search_failed',
        message: 'Theme is required',
      });
      return;
    }

    const prompt = `Voce e um orientador de estudos que faz pesquisa aprofundada na web. Responda em JSON valido com as chaves: "summary" (string em portugues do Brasil), "tips" (array com 5 dicas praticas), "nextSteps" (array com 3 proximos passos curtos). Tema de estudo: ${normalizedTheme}.`;
    const { outputText, groundingMetadata } = await runGroundedJsonPrompt(prompt);
    const parsed = JSON.parse(outputText);

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

    res.json({
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      webSearchQueries: Array.isArray(groundingMetadata?.webSearchQueries)
        ? groundingMetadata.webSearchQueries
        : [],
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

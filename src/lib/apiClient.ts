function resolveApiBaseUrl() {
  const configuredBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'http://localhost:3001';

  if (typeof window === 'undefined') {
    return configuredBaseUrl;
  }

  try {
    const configuredUrl = new URL(configuredBaseUrl);
    const currentHostname = window.location.hostname;
    const usesLocalhost =
      configuredUrl.hostname === 'localhost' || configuredUrl.hostname === '127.0.0.1';

    if (usesLocalhost && currentHostname && currentHostname !== 'localhost') {
      configuredUrl.hostname = currentHostname;
      return configuredUrl.toString().replace(/\/$/, '');
    }

    return configuredBaseUrl;
  } catch {
    return configuredBaseUrl;
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export type ApiHealthResponse = {
  ok: boolean;
  model: string;
  provider: string;
  configured: boolean;
};

export type AppUpdateResponse = {
  ok: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
  isRequired: boolean;
};

type ExplanationRequest = {
  subject: string;
  question: string;
};

type ReviewRequest = {
  text: string;
};

type StudyPlanRequest = {
  availableDays: string;
  hoursPerDay: string;
  method: string;
  objective: string;
};

type DeepSearchRequest = {
  theme: string;
  course?: string;
  mode?: string;
  filters?: string[];
  courseOverview?: string;
  focusAreas?: string[];
  relatedTerms?: string[];
};

export type DeepSearchResponse = {
  theme: string;
  course: string;
  summary: string;
  whyItMatters: string;
  keyTopics: string[];
  practicalApplications: string[];
  tips: string[];
  nextSteps: string[];
  studyQuestions: string[];
  webSearchQueries: string[];
  sources: Array<{
    title: string;
    url: string;
  }>;
  videos: Array<{
    title: string;
    url: string;
  }>;
};

async function postJson<TBody extends object>(path: string, body: TBody) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    try {
      const parsed = JSON.parse(errorBody) as { message?: string };
      throw new Error(parsed.message || 'Request failed');
    } catch {
      throw new Error(errorBody || 'Request failed');
    }
  }

  return response.json();
}

export async function requestApiHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error('Nao foi possivel verificar a API');
  }

  return (await response.json()) as ApiHealthResponse;
}

export async function requestAppUpdate() {
  const response = await fetch(`${API_BASE_URL}/api/app-update`);

  if (!response.ok) {
    throw new Error('Nao foi possivel verificar atualizacoes do app');
  }

  return (await response.json()) as AppUpdateResponse;
}

export async function requestExplanation(body: ExplanationRequest) {
  return postJson('/api/explain', body);
}

export async function requestReview(body: ReviewRequest) {
  return postJson('/api/review', body);
}

export async function requestStudyPlan(body: StudyPlanRequest) {
  return postJson('/api/study-plan', body);
}

export async function requestDeepSearch(body: DeepSearchRequest) {
  return postJson('/api/deep-search', body) as Promise<DeepSearchResponse>;
}

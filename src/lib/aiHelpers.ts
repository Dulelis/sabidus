type ExplanationInput = {
  subject: string;
  question: string;
};

type StudyPlanInput = {
  availableDays: string;
  hoursPerDay: string;
  method: string;
  objective: string;
};

export function generateExplanation({ subject, question }: ExplanationInput) {
  const normalizedSubject = subject.trim() || 'seu conteudo';
  const normalizedQuestion = question.trim() || 'sua duvida';

  return [
    `Comece identificando a ideia central de ${normalizedSubject}: destaque os conceitos principais ligados a ${normalizedQuestion}.`,
    `Quebre o assunto em partes menores, escrevendo definicao, exemplo pratico e aplicacao em exercicios ou situacoes reais.`,
    `Revise usando perguntas curtas: o que e, para que serve, onde aparece e como comparar com outros topicos do mesmo curso.`,
  ];
}

export function analyzeStudentText(text: string) {
  const trimmed = text.trim();
  const issues: string[] = [];

  if (trimmed.length < 120) {
    issues.push('O texto ainda esta curto; vale desenvolver melhor introducao, argumento e fechamento.');
  }

  if (!/[.!?]$/.test(trimmed)) {
    issues.push('Finalize o texto com pontuacao para melhorar a leitura e a organizacao das ideias.');
  }

  if (!/[A-ZÀ-Ú]/.test(trimmed.charAt(0))) {
    issues.push('Comece o texto com letra maiuscula para deixar a abertura mais adequada.');
  }

  if (!trimmed.includes(',')) {
    issues.push('Faltam pausas intermediarias; tente usar virgulas em trechos longos para dar clareza.');
  }

  const plagiarismNote =
    'A verificacao local nao compara com fontes externas; ela apenas alerta para repeticao e falta de autoria. Em uma integracao real, aqui entraria um verificador com base documental.';

  const revisedPreview =
    trimmed.length === 0
      ? ''
      : `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}${
          /[.!?]$/.test(trimmed) ? '' : '.'
        }`;

  return {
    issues,
    plagiarismNote,
    revisedPreview,
  };
}

export function generateStudyPlan({
  availableDays,
  hoursPerDay,
  method,
  objective,
}: StudyPlanInput) {
  const days = Number(availableDays || 0);
  const hours = Number(hoursPerDay || 0);
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 7) : 5;
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 2;
  const studyMethod = method.trim() || 'estudo intercalado';
  const focus = objective.trim() || 'revisar conteudos principais';

  return Array.from({ length: safeDays }, (_, index) => ({
    day: `Dia ${index + 1}`,
    plan: `${safeHours}h com ${studyMethod}: 60% em ${focus}, 20% em revisao ativa e 20% em exercicios ou resumo.`,
  }));
}

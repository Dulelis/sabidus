import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ScreenLayout } from '@/components/ScreenLayout';
import {
  enemTopics,
  findResourceModuleById,
  formulaGuides,
  notifications,
  simulatedExams,
  studyMethods,
  videoLessons,
} from '@/data/mockData';
import { useStudy } from '@/context/StudyContext';
import {
  analyzeStudentText,
  generateExplanation,
  generateStudyPlan,
} from '@/lib/aiHelpers';
import {
  requestApiHealth,
  requestExplanation,
  requestReview,
  requestStudyPlan,
} from '@/lib/apiClient';
import { openStudyMaterialUrl } from '@/lib/studyMaterials';
import { styles } from '@/styles/appStyles';

type ReviewResult = {
  issues: string[];
  revisedPreview: string;
  plagiarismNote: string;
};

type StudyPlanItem = {
  day: string;
  plan: string;
};

type ApiStatus = {
  configured: boolean;
  reachable: boolean;
  providerLabel: string;
  detail: string;
};

export default function ResourceDetailRoute() {
  const { id, focus, query, course } = useLocalSearchParams<{
    id: string;
    focus?: string;
    query?: string;
    course?: string;
  }>();
  const module = findResourceModuleById(id);
  const { addTask, customSummaries } = useStudy();

  const [firstValue, setFirstValue] = useState('');
  const [secondValue, setSecondValue] = useState('');
  const [gradeOne, setGradeOne] = useState('');
  const [gradeTwo, setGradeTwo] = useState('');
  const [gradeThree, setGradeThree] = useState('');
  const [aiSubject, setAiSubject] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [essayText, setEssayText] = useState('');
  const [availableDays, setAvailableDays] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [method, setMethod] = useState('');
  const [objective, setObjective] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState(videoLessons[0]?.id ?? '');
  const [selectedMethodId, setSelectedMethodId] = useState(studyMethods[0]?.id ?? '');
  const [selectedFormulaId, setSelectedFormulaId] = useState(formulaGuides[0]?.id ?? '');
  const [selectedExamId, setSelectedExamId] = useState(simulatedExams[0]?.id ?? '');
  const [selectedEnemId, setSelectedEnemId] = useState(enemTopics[0]?.id ?? '');
  const [videoGoal, setVideoGoal] = useState('');
  const [studyChallenge, setStudyChallenge] = useState('');
  const [formulaPractice, setFormulaPractice] = useState('');
  const [savedVideoGoal, setSavedVideoGoal] = useState('');
  const [savedMethodChallenge, setSavedMethodChallenge] = useState('');
  const [savedMethodId, setSavedMethodId] = useState('');
  const [savedFormulaPractice, setSavedFormulaPractice] = useState('');
  const [savedFormulaId, setSavedFormulaId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSource, setAiSource] = useState<'api' | 'local'>('local');
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    configured: false,
    reachable: false,
    providerLabel: 'fallback local',
    detail: 'Verificando conexao com a API...',
  });
  const [feedbackMessage, setFeedbackMessage] = useState(
    'Preencha os campos para testar este recurso.'
  );
  const [apiExplanation, setApiExplanation] = useState<string[] | null>(null);
  const [apiReview, setApiReview] = useState<ReviewResult | null>(null);
  const [apiStudyPlan, setApiStudyPlan] = useState<StudyPlanItem[] | null>(null);

  const simpleSum = (Number(firstValue || 0) + Number(secondValue || 0)).toFixed(2);
  const averageGrade = (
    (Number(gradeOne || 0) + Number(gradeTwo || 0) + Number(gradeThree || 0)) /
    3
  ).toFixed(2);

  const fallbackExplanation = generateExplanation({
    subject: aiSubject,
    question: aiQuestion,
  });
  const fallbackReview = analyzeStudentText(essayText);
  const fallbackStudyPlan = generateStudyPlan({
    availableDays,
    hoursPerDay,
    method,
    objective,
  });

  const currentExplanation = apiExplanation ?? fallbackExplanation;
  const currentReview = apiReview ?? fallbackReview;
  const currentStudyPlan = apiStudyPlan ?? fallbackStudyPlan;
  const selectedVideo =
    videoLessons.find((item) => item.id === selectedVideoId) ?? videoLessons[0];
  const selectedMethod =
    studyMethods.find((item) => item.id === selectedMethodId) ?? studyMethods[0];
  const selectedFormula =
    formulaGuides.find((item) => item.id === selectedFormulaId) ?? formulaGuides[0];
  const selectedExam =
    simulatedExams.find((item) => item.id === selectedExamId) ?? simulatedExams[0];
  const selectedEnemTopic =
    enemTopics.find((item) => item.id === selectedEnemId) ?? enemTopics[0];
  const normalizedQuery = query?.trim() ?? '';
  const normalizedCourse = course?.trim() ?? '';
  const formulaExamples: Record<string, string> = {
    bhaskara:
      'Use quando a equacao estiver no formato ax2 + bx + c = 0. Primeiro calcule o delta, depois substitua os valores e interprete quantas raizes existem.',
    'velocidade-media':
      'Aplique em problemas de deslocamento: some a distancia percorrida e divida pelo tempo total, sempre mantendo as unidades coerentes.',
    molaridade:
      'A relacao principal e quantidade de mols dividida pelo volume da solucao em litros. Verifique se o volume nao ficou em mL antes de calcular.',
  };
  const methodRecommendations: Record<string, string> = {
    pomodoro:
      'Ideal para quem se distrai com facilidade. Monte 4 blocos curtos e reserve a ultima pausa para revisar erros e duvidas.',
    'revisao-ativa':
      'Funciona melhor depois da aula. Leia uma vez, feche o material e tente reconstruir os conceitos com suas proprias palavras.',
    'estudo-intercalado':
      'Ajuda quando ha varias materias na mesma semana. Alterne conteudos diferentes para aumentar comparacao e retencao.',
  };

  useEffect(() => {
    let isMounted = true;

    async function loadApiStatus() {
      try {
        const health = await requestApiHealth();

        if (!isMounted) {
          return;
        }

        setApiStatus({
          configured: health.configured,
          reachable: true,
          providerLabel: `API ${health.provider.toUpperCase()}`,
          detail: health.configured
            ? `API online com o modelo ${health.model}.`
            : `API online, mas sem chave configurada para ${health.provider}.`,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setApiStatus({
          configured: false,
          reachable: false,
          providerLabel: 'fallback local',
          detail: 'API indisponivel no momento. O app continua com respostas locais.',
        });
      }
    }

    void loadApiStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const normalizedFocus = focus?.trim();

    if (!normalizedFocus) {
      return;
    }

    if (id === 'videoaulas' && videoLessons.some((item) => item.id === normalizedFocus)) {
      setSelectedVideoId(normalizedFocus);
      return;
    }

    if (id === 'metodos-estudo' && studyMethods.some((item) => item.id === normalizedFocus)) {
      setSelectedMethodId(normalizedFocus);
      return;
    }

    if (id === 'formulas' && formulaGuides.some((item) => item.id === normalizedFocus)) {
      setSelectedFormulaId(normalizedFocus);
      return;
    }

    if (id === 'simulados' && simulatedExams.some((item) => item.id === normalizedFocus)) {
      setSelectedExamId(normalizedFocus);
      return;
    }

    if (id === 'enem' && enemTopics.some((item) => item.id === normalizedFocus)) {
      setSelectedEnemId(normalizedFocus);
    }
  }, [focus, id]);

  if (!module) {
    return (
      <ScreenLayout>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Recurso nao encontrado</Text>
          <Text style={styles.emptyText}>
            Esse modulo ainda nao foi configurado nesta base.
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  async function handleExplainWithApi() {
    if (!aiSubject.trim() || !aiQuestion.trim()) {
      setAiSource('local');
      setApiExplanation(null);
      setFeedbackMessage('Informe a materia e a duvida antes de consultar a IA.');
      return;
    }

    setIsLoading(true);
    setFeedbackMessage('Consultando a explicacao guiada...');

    try {
      const response = await requestExplanation({
        subject: aiSubject,
        question: aiQuestion,
      });
      setApiExplanation(Array.isArray(response.tips) ? response.tips : fallbackExplanation);
      setAiSource('api');
      setFeedbackMessage('Explicacao gerada com a API.');
    } catch (error) {
      setApiExplanation(null);
      setAiSource('local');
      setFeedbackMessage(
        error instanceof Error
          ? `${error.message} Exibindo sugestoes locais.`
          : 'Nao foi possivel consultar a API. Exibindo sugestoes locais.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReviewWithApi() {
    if (!essayText.trim()) {
      setAiSource('local');
      setApiReview(null);
      setFeedbackMessage('Cole um texto antes de pedir a revisao.');
      return;
    }

    setIsLoading(true);
    setFeedbackMessage('Analisando o texto...');

    try {
      const response = await requestReview({ text: essayText });
      setApiReview({
        issues: Array.isArray(response.issues) ? response.issues : fallbackReview.issues,
        revisedPreview:
          typeof response.revisedPreview === 'string'
            ? response.revisedPreview
            : fallbackReview.revisedPreview,
        plagiarismNote:
          typeof response.plagiarismNote === 'string'
            ? response.plagiarismNote
            : fallbackReview.plagiarismNote,
      });
      setAiSource('api');
      setFeedbackMessage('Revisao concluida com a API.');
    } catch (error) {
      setApiReview(null);
      setAiSource('local');
      setFeedbackMessage(
        error instanceof Error
          ? `${error.message} Exibindo revisao local.`
          : 'Nao foi possivel revisar com a API. Exibindo revisao local.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlanWithApi() {
    if (
      !availableDays.trim() ||
      !hoursPerDay.trim() ||
      !method.trim() ||
      !objective.trim()
    ) {
      setAiSource('local');
      setApiStudyPlan(null);
      setFeedbackMessage('Preencha todos os campos para gerar o cronograma.');
      return;
    }

    setIsLoading(true);
    setFeedbackMessage('Montando cronograma personalizado...');

    try {
      const response = await requestStudyPlan({
        availableDays,
        hoursPerDay,
        method,
        objective,
      });
      setApiStudyPlan(Array.isArray(response.items) ? response.items : fallbackStudyPlan);
      setAiSource('api');
      setFeedbackMessage('Cronograma gerado com a API.');
    } catch (error) {
      setApiStudyPlan(null);
      setAiSource('local');
      setFeedbackMessage(
        error instanceof Error
          ? `${error.message} Exibindo sugestao local.`
          : 'Nao foi possivel gerar pela API. Exibindo sugestao local.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSaveVideoGoal() {
    if (!selectedVideo) {
      setFeedbackMessage('Selecione uma videoaula antes de salvar um objetivo.');
      return;
    }

    const normalizedGoal = videoGoal.trim();

    if (!normalizedGoal) {
      setFeedbackMessage('Escreva um objetivo para a videoaula selecionada.');
      return;
    }

    addTask(`Assistir ${selectedVideo.title}: ${normalizedGoal}`);
    setSavedVideoGoal(normalizedGoal);
    setFeedbackMessage(`Objetivo salvo para "${selectedVideo.title}".`);
  }

  function handleEditVideoGoal() {
    if (!savedVideoGoal) {
      setFeedbackMessage('Nenhum objetivo salvo para editar nesta videoaula.');
      return;
    }

    setVideoGoal(savedVideoGoal);
    setFeedbackMessage('Objetivo carregado novamente para edicao.');
  }

  function handleClearVideoGoal() {
    setVideoGoal('');
    setSavedVideoGoal('');
    setSelectedVideoId(videoLessons[0]?.id ?? '');
    setFeedbackMessage('Selecao de video e objetivo limpos.');
  }

  function handleSaveMethodPlan() {
    addTask(
      `Aplicar ${selectedMethod.title} em ${
        studyChallenge.trim() || 'uma sessao de estudo desta semana'
      }`
    );
    setSavedMethodChallenge(studyChallenge.trim());
    setSavedMethodId(selectedMethod.id);
    setFeedbackMessage(
      `Plano salvo com ${selectedMethod.title}. Confira a tarefa criada na agenda.`
    );
  }

  function handleEditMethodPlan() {
    if (!savedMethodId) {
      setFeedbackMessage('Nenhuma estrategia salva para editar.');
      return;
    }

    setSelectedMethodId(savedMethodId);
    setStudyChallenge(savedMethodChallenge);
    setFeedbackMessage('Estrategia anterior carregada para ajuste.');
  }

  function handleClearMethodPlan() {
    setSelectedMethodId(studyMethods[0]?.id ?? '');
    setStudyChallenge('');
    setSavedMethodChallenge('');
    setSavedMethodId('');
    setFeedbackMessage('Metodo e desafio limpos.');
  }

  function handleSaveFormulaPractice() {
    addTask(
      formulaPractice.trim()
        ? `${selectedFormula.title}: ${formulaPractice.trim()}`
        : `Praticar exercicios de ${selectedFormula.title}`
    );
    setSavedFormulaPractice(formulaPractice.trim());
    setSavedFormulaId(selectedFormula.id);
    setFeedbackMessage(
      `Pratica de ${selectedFormula.title} adicionada na sua lista de tarefas.`
    );
  }

  function handleEditFormulaPractice() {
    if (!savedFormulaId) {
      setFeedbackMessage('Nenhuma pratica salva para editar.');
      return;
    }

    setSelectedFormulaId(savedFormulaId);
    setFormulaPractice(savedFormulaPractice);
    setFeedbackMessage('Pratica anterior carregada para ajuste.');
  }

  function handleClearFormulaPractice() {
    setSelectedFormulaId(formulaGuides[0]?.id ?? '');
    setFormulaPractice('');
    setSavedFormulaPractice('');
    setSavedFormulaId('');
    setFeedbackMessage('Selecao e pratica de formula limpas.');
  }

  return (
    <ScreenLayout>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.detailHero}>
        <Text style={styles.articleCategory}>{module.status}</Text>
        <Text style={styles.detailTitle}>{module.title}</Text>
        <Text style={styles.detailDescription}>{module.summary}</Text>
      </View>

      {(normalizedQuery || normalizedCourse) ? (
        <View style={styles.savedSummaryCard}>
          <Text style={styles.savedSummaryText}>
            {normalizedCourse && normalizedQuery
              ? `Aberto a partir da pesquisa por "${normalizedQuery}" no contexto do curso ${normalizedCourse}.`
              : normalizedQuery
                ? `Aberto a partir da pesquisa por "${normalizedQuery}".`
                : `Aberto no contexto do curso ${normalizedCourse}.`}
          </Text>
        </View>
      ) : null}

      <View style={styles.detailBodyCard}>
        <Text style={styles.sectionTitle}>Como esse modulo entra no app</Text>
        <Text style={styles.detailBodyText}>
          Este espaco foi preparado para receber cadastro do aluno, selecao por
          curso, organizacao por materia e sugestoes guiadas por IA.
        </Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            Resposta atual: {aiSource === 'api' ? apiStatus.providerLabel : 'fallback local'}
          </Text>
          <Text style={styles.statusText}>{apiStatus.detail}</Text>
          <Text style={styles.statusText}>{feedbackMessage}</Text>
        </View>
      </View>

      {id === 'calculadoras' && (
        <>
          <View style={styles.calculatorCard}>
            <Text style={styles.sectionTitle}>Calculadora simples</Text>
            <View style={styles.inlineInputs}>
              <TextInput
                style={styles.miniInput}
                value={firstValue}
                onChangeText={setFirstValue}
                keyboardType="numeric"
                placeholder="Valor 1"
                placeholderTextColor="#7D8597"
              />
              <TextInput
                style={styles.miniInput}
                value={secondValue}
                onChangeText={setSecondValue}
                keyboardType="numeric"
                placeholder="Valor 2"
                placeholderTextColor="#7D8597"
              />
            </View>
            <Text style={styles.calculatorResult}>Soma: {simpleSum}</Text>
            <Text style={styles.calculatorHint}>
              Base pronta para receber calculadora cientifica, fisica e quimica.
            </Text>
          </View>

          <View style={styles.calculatorCard}>
            <Text style={styles.sectionTitle}>Media escolar</Text>
            <View style={styles.inlineInputs}>
              <TextInput
                style={styles.miniInput}
                value={gradeOne}
                onChangeText={setGradeOne}
                keyboardType="numeric"
                placeholder="Nota 1"
                placeholderTextColor="#7D8597"
              />
              <TextInput
                style={styles.miniInput}
                value={gradeTwo}
                onChangeText={setGradeTwo}
                keyboardType="numeric"
                placeholder="Nota 2"
                placeholderTextColor="#7D8597"
              />
              <TextInput
                style={styles.miniInput}
                value={gradeThree}
                onChangeText={setGradeThree}
                keyboardType="numeric"
                placeholder="Nota 3"
                placeholderTextColor="#7D8597"
              />
            </View>
            <Text style={styles.calculatorResult}>Media: {averageGrade}</Text>
          </View>
        </>
      )}

      {id === 'simulados' && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Simulados disponiveis</Text>
            {simulatedExams.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.articleCard,
                  exam.id === selectedExamId && styles.articleCardActive,
                ]}
                onPress={() => {
                  setSelectedExamId(exam.id);
                  setFeedbackMessage(`Simulado "${exam.title}" selecionado.`);
                }}
              >
                <Text style={styles.articleCategory}>{exam.course}</Text>
                <Text style={styles.articleTitle}>{exam.title}</Text>
                <Text style={styles.articleDescription}>{exam.focus}</Text>
                <Text style={styles.toolText}>{exam.questionCount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedExam ? (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Simulado relacionado aberto</Text>
              <Text style={styles.detailBodyText}>
                {selectedExam.title} foi ligado a esta pesquisa para voce continuar o estudo com mais contexto.
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.searchButton, styles.controlButton]}
                  onPress={() => {
                    addTask(`Fazer ${selectedExam.title}`);
                    setFeedbackMessage(`Simulado "${selectedExam.title}" adicionado na lista de tarefas.`);
                  }}
                >
                  <Text style={styles.searchButtonText}>Adicionar a agenda</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.controlButton]}
                  onPress={() =>
                    router.push({
                      pathname: '/pesquisar',
                      params: {
                        query: selectedExam.title,
                        course: selectedExam.course.toLowerCase(),
                      },
                    })
                  }
                >
                  <Text style={styles.secondaryButtonText}>Buscar relacionados</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </>
      )}

      {id === 'enem' && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mapa do ENEM</Text>
            {enemTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.toolItem,
                  topic.id === selectedEnemId && styles.articleCardActive,
                ]}
                onPress={() => {
                  setSelectedEnemId(topic.id);
                  setFeedbackMessage(`Topico "${topic.subject} | ${topic.branch}" selecionado.`);
                }}
              >
                <Text style={styles.toolTitle}>
                  {topic.subject} | {topic.branch}
                </Text>
                <Text style={styles.toolText}>{topic.summary}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedEnemTopic ? (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Topico relacionado aberto</Text>
              <Text style={styles.detailBodyText}>{selectedEnemTopic.summary}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.searchButton, styles.controlButton]}
                  onPress={() => {
                    addTask(`Revisar ${selectedEnemTopic.subject}: ${selectedEnemTopic.branch}`);
                    setFeedbackMessage(
                      `Topico "${selectedEnemTopic.subject} | ${selectedEnemTopic.branch}" enviado para sua lista de tarefas.`
                    );
                  }}
                >
                  <Text style={styles.searchButtonText}>Marcar revisao</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.controlButton]}
                  onPress={() =>
                    router.push({
                      pathname: '/pesquisar',
                      params: {
                        query: `${selectedEnemTopic.subject} ${selectedEnemTopic.branch}`,
                      },
                    })
                  }
                >
                  <Text style={styles.secondaryButtonText}>Buscar relacionados</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </>
      )}

      {id === 'videoaulas' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biblioteca de videoaulas</Text>
          {videoLessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={[
                styles.articleCard,
                lesson.id === selectedVideoId && styles.articleCardActive,
              ]}
              onPress={() => {
                setSelectedVideoId(lesson.id);
                setFeedbackMessage(`Videoaula "${lesson.title}" aberta no modulo.`);
              }}
            >
              <Text style={styles.articleCategory}>{lesson.course}</Text>
              <Text style={styles.articleTitle}>{lesson.title}</Text>
              <Text style={styles.articleDescription}>{lesson.creatorBio}</Text>
              <View style={styles.articleMetaRow}>
                <View style={styles.articleMetaPill}>
                  <Text style={styles.articleMetaText}>{lesson.creator}</Text>
                </View>
                <View style={styles.articleMetaPill}>
                  <Text style={styles.articleMetaText}>{lesson.platform}</Text>
                </View>
                <View style={styles.articleMetaPill}>
                  <Text style={styles.articleMetaText}>{lesson.year}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/pesquisar',
                    params: {
                      query: lesson.title,
                      course: lesson.course.toLowerCase(),
                    },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Buscar material relacionado</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {selectedVideo ? (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Video selecionado</Text>
              <Text style={styles.detailBodyText}>
                {selectedVideo.title} | {selectedVideo.creator}
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.controlButton]}
                  onPress={() => {
                    void openStudyMaterialUrl(selectedVideo.url)
                      .then(() => {
                        setFeedbackMessage(`Abrindo "${selectedVideo.title}".`);
                      })
                      .catch((error) => {
                        setFeedbackMessage(
                          error instanceof Error
                            ? error.message
                            : 'Nao foi possivel abrir esse video agora.'
                        );
                      });
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Abrir video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.controlButton]}
                  onPress={() =>
                    router.push({
                      pathname: '/pesquisar',
                      params: {
                        query: selectedVideo.title,
                        course: selectedVideo.course.toLowerCase(),
                      },
                    })
                  }
                >
                  <Text style={styles.secondaryButtonText}>Buscar relacionados</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Objetivo da videoaula</Text>
              <TextInput
                style={styles.textArea}
                value={videoGoal}
                onChangeText={setVideoGoal}
                multiline
                placeholder="Ex: assistir e resumir os pontos mais importantes"
                placeholderTextColor="#7D8597"
              />
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.searchButton, styles.controlButton]}
                  onPress={handleSaveVideoGoal}
                >
                  <Text style={styles.searchButtonText}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.controlButton]}
                  onPress={handleEditVideoGoal}
                >
                  <Text style={styles.secondaryButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerButton, styles.controlButton]}
                  onPress={handleClearVideoGoal}
                >
                  <Text style={styles.dangerButtonText}>Limpar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Lembretes de acompanhamento</Text>
            {notifications.map((item) => (
              <Text key={item.id} style={styles.helperBullet}>
                - {item.title}: {item.detail}
              </Text>
            ))}
          </View>
        </View>
      )}

      {id === 'metodos-estudo' && selectedMethod && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Escolha seu metodo base</Text>
            <View style={styles.chipRow}>
              {studyMethods.map((item) => {
                const isActive = item.id === selectedMethodId;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedMethodId(item.id)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.planningCard}>
            <Text style={styles.planningTitle}>{selectedMethod.title}</Text>
            <Text style={styles.planningText}>{selectedMethod.description}</Text>
            <Text style={styles.detailBodyText}>{selectedMethod.howItWorks}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Desafio atual</Text>
            <TextInput
              style={styles.textArea}
              value={studyChallenge}
              onChangeText={setStudyChallenge}
              multiline
              placeholder="Ex: tenho pouco tempo e me distraio facil em matematica"
              placeholderTextColor="#7D8597"
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.searchButton, styles.controlButton]}
                onPress={handleSaveMethodPlan}
              >
                <Text style={styles.searchButtonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.controlButton]}
                onPress={handleEditMethodPlan}
              >
                <Text style={styles.secondaryButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerButton, styles.controlButton]}
                onPress={handleClearMethodPlan}
              >
                <Text style={styles.dangerButtonText}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Recomendacao pratica</Text>
            <Text style={styles.helperBullet}>
              - {methodRecommendations[selectedMethod.id]}
            </Text>
            {studyChallenge.trim() ? (
              <Text style={styles.helperBullet}>
                - Para o seu caso: comece por "{studyChallenge.trim()}" e avalie o resultado
                apos a primeira sessao.
              </Text>
            ) : null}
          </View>
        </>
      )}

      {id === 'formulas' && selectedFormula && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guias de formula</Text>
            {formulaGuides.map((formula) => (
              <TouchableOpacity
                key={formula.id}
                style={[
                  styles.articleCard,
                  formula.id === selectedFormulaId && styles.articleCardActive,
                ]}
                onPress={() => setSelectedFormulaId(formula.id)}
              >
                <Text style={styles.articleCategory}>{formula.area}</Text>
                <Text style={styles.articleTitle}>{formula.title}</Text>
                <Text style={styles.articleDescription}>{formula.explanation}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.detailBodyCard}>
            <Text style={styles.sectionTitle}>Como usar</Text>
            <Text style={styles.detailBodyText}>
              {formulaExamples[selectedFormula.id]}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Pratica ou observacao</Text>
            <TextInput
              style={styles.textArea}
              value={formulaPractice}
              onChangeText={setFormulaPractice}
              multiline
              placeholder="Ex: revisar delta e fazer 5 exercicios"
              placeholderTextColor="#7D8597"
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.searchButton, styles.controlButton]}
                onPress={handleSaveFormulaPractice}
              >
                <Text style={styles.searchButtonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.controlButton]}
                onPress={handleEditFormulaPractice}
              >
                <Text style={styles.secondaryButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerButton, styles.controlButton]}
                onPress={handleClearFormulaPractice}
              >
                <Text style={styles.dangerButtonText}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {id === 'duvidas-ia' && (
        <>
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Materia</Text>
            <TextInput
              style={styles.searchInput}
              value={aiSubject}
              onChangeText={setAiSubject}
              placeholder="Ex: biologia"
              placeholderTextColor="#7D8597"
            />
            <Text style={styles.formLabel}>Duvida do aluno</Text>
            <TextInput
              style={styles.textArea}
              value={aiQuestion}
              onChangeText={setAiQuestion}
              multiline
              placeholder="Descreva o que nao ficou claro"
              placeholderTextColor="#7D8597"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleExplainWithApi}>
              <Text style={styles.searchButtonText}>
                {isLoading ? 'Consultando IA...' : 'Consultar IA'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Explicacao guiada</Text>
            {currentExplanation.map((tip) => (
              <Text key={tip} style={styles.helperBullet}>
                - {tip}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumos ja cadastrados</Text>
            {customSummaries.slice(0, 3).map((summary) => (
              <View key={summary.id} style={styles.detailBodyCard}>
                <Text style={styles.articleCategory}>{summary.subject}</Text>
                <Text style={styles.detailBodyText}>{summary.summary}</Text>
                <Text style={styles.toolText}>Duvida: {summary.openQuestions}</Text>
              </View>
            ))}
            {customSummaries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhum resumo salvo ainda</Text>
                <Text style={styles.emptyText}>
                  Salve um resumo na aba Conta para reutilizar aqui nas duvidas guiadas.
                </Text>
              </View>
            ) : null}
          </View>
        </>
      )}

      {id === 'cronograma-ia' && (
        <>
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Dias disponiveis</Text>
            <TextInput
              style={styles.searchInput}
              value={availableDays}
              onChangeText={setAvailableDays}
              keyboardType="numeric"
              placeholder="Ex: 5"
              placeholderTextColor="#7D8597"
            />
            <Text style={styles.formLabel}>Horas por dia</Text>
            <TextInput
              style={styles.searchInput}
              value={hoursPerDay}
              onChangeText={setHoursPerDay}
              keyboardType="numeric"
              placeholder="Ex: 2"
              placeholderTextColor="#7D8597"
            />
            <Text style={styles.formLabel}>Metodo</Text>
            <TextInput
              style={styles.searchInput}
              value={method}
              onChangeText={setMethod}
              placeholder="Ex: pomodoro"
              placeholderTextColor="#7D8597"
            />
            <Text style={styles.formLabel}>Objetivo</Text>
            <TextInput
              style={styles.textArea}
              value={objective}
              onChangeText={setObjective}
              multiline
              placeholder="Ex: revisar pedagogia inclusiva e biologia"
              placeholderTextColor="#7D8597"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handlePlanWithApi}>
              <Text style={styles.searchButtonText}>
                {isLoading ? 'Gerando cronograma...' : 'Gerar com IA'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cronograma sugerido</Text>
            {currentStudyPlan.map((item) => (
              <View key={item.day} style={styles.articleCard}>
                <Text style={styles.articleCategory}>{item.day}</Text>
                <Text style={styles.articleDescription}>{item.plan}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {id === 'escrita' && (
        <>
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Cole seu texto</Text>
            <TextInput
              style={styles.textArea}
              value={essayText}
              onChangeText={setEssayText}
              multiline
              placeholder="Cole aqui sua redacao, resumo ou paragrafo"
              placeholderTextColor="#7D8597"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleReviewWithApi}>
              <Text style={styles.searchButtonText}>
                {isLoading ? 'Revisando texto...' : 'Revisar com IA'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.sectionTitle}>Orientacoes de correcao</Text>
            {(currentReview.issues.length > 0
              ? currentReview.issues
              : ['O texto ja apresenta uma base boa de estrutura e pode seguir para refinamento.']
            ).map((issue) => (
              <Text key={issue} style={styles.helperBullet}>
                - {issue}
              </Text>
            ))}
          </View>

          <View style={styles.detailBodyCard}>
            <Text style={styles.sectionTitle}>Versao revisada sugerida</Text>
            <Text style={styles.detailBodyText}>
              {currentReview.revisedPreview || 'Escreva um texto para gerar uma revisao inicial.'}
            </Text>
            <Text style={styles.sectionTitle}>Analise de originalidade</Text>
            <Text style={styles.toolText}>{currentReview.plagiarismNote}</Text>
          </View>
        </>
      )}
    </ScreenLayout>
  );
}

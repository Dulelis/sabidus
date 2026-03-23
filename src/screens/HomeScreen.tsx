import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  articles,
  assessments,
  discoveries,
  highlightTopics,
  weeklySchedule,
} from '../data/mockData';
import { styles } from '../styles/appStyles';
import { MetricCard } from '../components/MetricCard';
import { useStudy } from '../context/StudyContext';
import type { StudyMaterial } from '../types/app';

type HomeScreenProps = {
  query: string;
  setQuery: (value: string) => void;
  selectedCourse: string;
  setSelectedCourse: (value: string) => void;
};

type WebPickedMaterial = {
  title: string;
  url: string;
  mimeType: string;
};

type HomeAlert = {
  id: string;
  title: string;
  detail: string;
  priority: 'Alta' | 'Media' | 'Baixa';
  target: 'agenda' | 'inicio';
};

function buildMaterialLabelFromLink(value: string) {
  try {
    const parsedUrl = new URL(value);
    const pathName = parsedUrl.pathname.split('/').filter(Boolean).pop();

    return pathName ? decodeURIComponent(pathName) : parsedUrl.hostname;
  } catch {
    return value;
  }
}

function openMaterialInBrowser(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  void Linking.openURL(url);
}

async function pickWebMaterial(options: {
  accept: string;
  capture?: 'environment';
}): Promise<WebPickedMaterial | null> {
  const browserDocument = (globalThis as { document?: any }).document;
  const browserUrl = (globalThis as { URL?: any }).URL;

  if (!browserDocument || !browserUrl) {
    return null;
  }

  return new Promise((resolve) => {
    const input = browserDocument.createElement('input');
    input.type = 'file';
    input.accept = options.accept;

    if (options.capture) {
      input.capture = options.capture;
    }

    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) {
        resolve(null);
        return;
      }

      resolve({
        title: file.name || 'material',
        url: browserUrl.createObjectURL(file),
        mimeType: file.type || 'application/octet-stream',
      });
    };

    input.click();
  });
}

function getMaterialKindLabel(kind: StudyMaterial['kind']) {
  if (kind === 'arquivo') {
    return 'Arquivo interno';
  }

  if (kind === 'arquivo-externo') {
    return 'Arquivo externo';
  }

  if (kind === 'camera') {
    return 'Captura pela camera';
  }

  return 'Link de estudo';
}

function parseTimeToMinutes(value: string) {
  const [hoursText, minutesText] = value.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function parseRangeToDurationInMinutes(value: string) {
  const [startText, endText] = value.split('-').map((item) => item.trim());

  if (!startText || !endText) {
    return 0;
  }

  const startMinutes = parseTimeToMinutes(startText);
  const endMinutes = parseTimeToMinutes(endText);

  if (endMinutes <= startMinutes) {
    return 0;
  }

  return endMinutes - startMinutes;
}

function formatWeeklyHours(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (!hours) {
    return `${remainingMinutes}m`;
  }

  if (!remainingMinutes) {
    return `${hours}h`;
  }

  return `${hours}h${String(remainingMinutes).padStart(2, '0')}`;
}

function parseBrazilianDate(value: string) {
  const [dayText, monthText, yearText] = value.split('/');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    !day ||
    !month ||
    !year
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function diffInDays(targetDate: Date, baseDate: Date) {
  const startOfBaseDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );
  const startOfTargetDate = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );

  return Math.round(
    (startOfTargetDate.getTime() - startOfBaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function HomeScreen({
  query,
  setQuery,
  selectedCourse,
  setSelectedCourse,
}: HomeScreenProps) {
  const {
    addCourse,
    calendarItems,
    addTask,
    courseCatalog,
    courseKnowledge,
    customTasks,
    customSummaries,
    deleteCourse,
    desiredCourse,
    addStudyMaterial,
    openSearchTheme,
    deleteStudyMaterial,
    savedArticleIds,
    studyMaterials,
    updateCourse,
  } = useStudy();
  const [feedbackMessage, setFeedbackMessage] = useState(
    'Use a busca inicial para abrir artigos, recursos e trilhas de estudo.'
  );
  const [courseSearch, setCourseSearch] = useState('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialLink, setMaterialLink] = useState('');

  const visibleCourses = useMemo(() => {
    const normalizedCourseSearch = courseSearch.trim().toLowerCase();

    if (!normalizedCourseSearch) {
      return courseCatalog;
    }

    return courseCatalog.filter((course) =>
      course.label.toLowerCase().includes(normalizedCourseSearch)
    );
  }, [courseCatalog, courseSearch]);

  const selectedCourseLabel =
    selectedCourse === 'todos'
      ? ''
      : courseCatalog.find((course) => course.id === selectedCourse)?.label || '';
  const selectedCourseKnowledge = courseKnowledge.find(
    (item) =>
      item.courseId === selectedCourse ||
      item.courseLabel.toLowerCase() === selectedCourseLabel.toLowerCase()
  );
  const searchedCourseKnowledge =
    courseSearch.trim() && !selectedCourseKnowledge
      ? courseKnowledge.find(
          (item) => item.courseLabel.toLowerCase() === courseSearch.trim().toLowerCase()
        ) || null
      : null;

  const filteredHighlights = highlightTopics.filter((item) =>
    selectedCourse === 'todos'
      ? true
      : item.course.toLowerCase() === selectedCourse.toLowerCase()
  );

  const recommendedArticles = articles.filter((item) =>
    selectedCourse === 'todos'
      ? true
      : item.course.toLowerCase() === selectedCourse.toLowerCase()
  );

  const savedContentCount = useMemo(
    () => savedArticleIds.length + customSummaries.length + studyMaterials.length,
    [customSummaries.length, savedArticleIds.length, studyMaterials.length]
  );

  const weeklyStudyHours = useMemo(
    () =>
      formatWeeklyHours(
        weeklySchedule.reduce(
          (total, slot) => total + parseRangeToDurationInMinutes(slot.time),
          0
        )
      ),
    []
  );

  const importantNotifications = useMemo(() => {
    const today = new Date();
    const priorityWeight: Record<HomeAlert['priority'], number> = {
      Alta: 3,
      Media: 2,
      Baixa: 1,
    };

    const alerts = calendarItems
      .map<HomeAlert | null>((item) => {
        const parsedDate = parseBrazilianDate(item.dueDate);

        if (!parsedDate) {
          return {
            id: `alert-${item.id}`,
            title: item.title,
            detail: `${item.subject} | ${item.type} com data registrada em ${item.dueDate}.`,
            priority: 'Media' as const,
            target: 'agenda' as const,
          };
        }

        const daysUntilDue = diffInDays(parsedDate, today);

        if (daysUntilDue < 0) {
          return null;
        }

        const priority: HomeAlert['priority'] =
          daysUntilDue <= 2 ? 'Alta' : daysUntilDue <= 5 ? 'Media' : 'Baixa';
        const deadlineCopy =
          daysUntilDue === 0
            ? 'vence hoje'
            : daysUntilDue === 1
              ? 'vence amanha'
              : `vence em ${daysUntilDue} dias`;

        return {
          id: `alert-${item.id}`,
          title: item.title,
          detail: `${item.subject} | ${item.type} | ${deadlineCopy} (${item.dueDate}).`,
          priority,
          target: 'agenda' as const,
        };
      })
      .filter((item): item is HomeAlert => item !== null)
      .sort((first, second) => priorityWeight[second.priority] - priorityWeight[first.priority]);

    if (customTasks.length > 0) {
      alerts.push({
        id: 'alert-custom-tasks',
        title:
          customTasks.length === 1
            ? '1 tarefa aguardando revisao'
            : `${customTasks.length} tarefas aguardando revisao`,
        detail: `Abra a agenda para acompanhar seus proximos estudos e entregas.`,
        priority: customTasks.length >= 5 ? 'Alta' : 'Media',
        target: 'agenda',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'alert-empty',
        title: 'Semana organizada',
        detail: 'Nenhuma prova ou trabalho urgente no momento. Continue alimentando a agenda.',
        priority: 'Baixa',
        target: 'inicio',
      });
    }

    return alerts.slice(0, 4);
  }, [calendarItems, customTasks.length]);

  function handleOpenHomeAlert(alert: HomeAlert) {
    if (alert.target === 'agenda') {
      router.push('/agenda');
      return;
    }

    setFeedbackMessage(alert.detail);
  }

  const discoveryActions: Record<string, () => void> = {
    'Artigos cientificos': () =>
      openSearchTheme({
        query: query || desiredCourse || 'artigos cientificos',
        course: selectedCourse,
      }),
    'Pesquisas academicas': () =>
      openSearchTheme({
        query: query || 'pesquisas academicas',
        course: selectedCourse,
      }),
    'Canais para assistir': () => router.push('/recurso/videoaulas'),
    'Modelos de trabalhos': () => router.push('/recurso/escrita'),
  };

  function handleSearchFromHome() {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setFeedbackMessage('Digite um tema, materia ou assunto antes de buscar.');
      return;
    }

    openSearchTheme({
      query: normalizedQuery,
      course: selectedCourse,
    });
    setFeedbackMessage(`Busca por "${normalizedQuery}" enviada para a pagina de pesquisa.`);
    router.replace('/pesquisar');
  }

  function handleAddCourse() {
    const createdCourse = addCourse(courseSearch);

    if (!createdCourse) {
      setFeedbackMessage('Digite o nome do curso para adicionar conhecimento.');
      return;
    }

    setSelectedCourse(createdCourse.id);
    setCourseSearch(createdCourse.label);
    setFeedbackMessage(`Curso "${createdCourse.label}" adicionado com conhecimento inicial.`);
  }

  function handleEditCourse() {
    if (selectedCourse === 'todos') {
      setFeedbackMessage('Selecione um curso especifico para editar.');
      return;
    }

    const updatedCourse = updateCourse(selectedCourse, courseSearch);

    if (!updatedCourse) {
      setFeedbackMessage('Digite um novo nome para atualizar o curso selecionado.');
      return;
    }

    setSelectedCourse(updatedCourse.id);
    setCourseSearch(updatedCourse.label);
    setFeedbackMessage(`Curso atualizado para "${updatedCourse.label}".`);
  }

  function handleDeleteCourse() {
    if (selectedCourse === 'todos') {
      setFeedbackMessage('Selecione um curso especifico para apagar.');
      return;
    }

    const labelToDelete =
      courseCatalog.find((course) => course.id === selectedCourse)?.label || selectedCourse;
    deleteCourse(selectedCourse);
    setSelectedCourse('todos');
    setCourseSearch('');
    setFeedbackMessage(`Curso "${labelToDelete}" removido do catalogo.`);
  }

  function handleAddMaterialFromLink(kind: 'arquivo-externo' | 'link') {
    const normalizedLink = materialLink.trim();

    if (!normalizedLink) {
      setFeedbackMessage('Cole um link antes de adicionar um material externo.');
      return;
    }

    const normalizedTitle = materialTitle.trim() || buildMaterialLabelFromLink(normalizedLink);
    const createdMaterial = addStudyMaterial({
      title: normalizedTitle,
      kind,
      url: normalizedLink,
      mimeType:
        kind === 'arquivo-externo' ? 'application/octet-stream' : 'text/html',
      storageMode: 'persisted',
    });

    if (!createdMaterial) {
      setFeedbackMessage('Esse link ja foi salvo ou esta incompleto.');
      return;
    }

    setMaterialTitle('');
    setMaterialLink('');
    setFeedbackMessage(`Material "${createdMaterial.title}" salvo na Inicio.`);
  }

  async function handleAddLocalMaterial(kind: 'arquivo' | 'camera') {
    if (Platform.OS !== 'web') {
      setFeedbackMessage(
        'No momento, arquivo e camera estao liberados na versao web do app.'
      );
      return;
    }

    const pickedMaterial = await pickWebMaterial({
      accept:
        kind === 'camera'
          ? 'image/*'
          : '.pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,image/*',
      capture: kind === 'camera' ? 'environment' : undefined,
    });

    if (!pickedMaterial) {
      setFeedbackMessage('Nenhum material foi selecionado.');
      return;
    }

    const createdMaterial = addStudyMaterial({
      title: materialTitle.trim() || pickedMaterial.title,
      kind,
      url: pickedMaterial.url,
      mimeType: pickedMaterial.mimeType,
      storageMode: 'session',
    });

    if (!createdMaterial) {
      const browserUrl = (globalThis as { URL?: any }).URL;
      browserUrl?.revokeObjectURL?.(pickedMaterial.url);
      setFeedbackMessage('Esse material ja foi adicionado nesta sessao.');
      return;
    }

    setMaterialTitle('');
    setFeedbackMessage(
      kind === 'camera'
        ? `Captura "${createdMaterial.title}" adicionada para consulta rapida.`
        : `Arquivo "${createdMaterial.title}" adicionado nesta sessao.`
    );
  }

  function handleOpenMaterial(material: StudyMaterial) {
    openMaterialInBrowser(material.url);
  }

  function handleDeleteMaterial(material: StudyMaterial) {
    const wasDeleted = deleteStudyMaterial(material.id);

    if (!wasDeleted) {
      setFeedbackMessage('Nao foi possivel apagar esse material.');
      return;
    }

    if (material.storageMode === 'session' && Platform.OS === 'web') {
      const browserUrl = (globalThis as { URL?: any }).URL;
      browserUrl?.revokeObjectURL?.(material.url);
    }

    setFeedbackMessage(`Material "${material.title}" removido da Inicio.`);
  }

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Plano do dia</Text>
        </View>
        <Text style={styles.heroTitle}>O que voce precisa aprender hoje?</Text>
        <Text style={styles.heroSubtitle}>
          Busque artigos, pesquisas, aulas e organize seu ritmo de estudo em um
          unico app.
          {desiredCourse.trim() ? ` Curso pretendido: ${desiredCourse.trim()}.` : ''}
        </Text>

        <View style={styles.searchBox}>
          <TextInput
            placeholder="Buscar artigos, temas ou materias"
            placeholderTextColor="#7D8597"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchFromHome}>
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.savedSummaryCard}>
        <Text style={styles.savedSummaryText}>{feedbackMessage}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Adicionar material</Text>
          <Text style={styles.sectionLink}>{studyMaterials.length} salvos</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Titulo do material</Text>
          <TextInput
            placeholder="Ex: apostila de anatomia"
            placeholderTextColor="#7D8597"
            style={styles.searchInput}
            value={materialTitle}
            onChangeText={setMaterialTitle}
          />
          <Text style={styles.formLabel}>Link externo ou de download</Text>
          <TextInput
            placeholder="Cole um link para artigo, video ou arquivo externo"
            placeholderTextColor="#7D8597"
            style={styles.searchInput}
            value={materialLink}
            onChangeText={setMaterialLink}
            autoCapitalize="none"
          />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.searchButton, styles.controlButton]}
              onPress={() => {
                void handleAddLocalMaterial('arquivo');
              }}
            >
              <Text style={styles.searchButtonText}>Arquivo interno</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.controlButton]}
              onPress={() => handleAddMaterialFromLink('arquivo-externo')}
            >
              <Text style={styles.secondaryButtonText}>Arquivo externo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.controlButton]}
              onPress={() => handleAddMaterialFromLink('link')}
            >
              <Text style={styles.secondaryButtonText}>Link de estudo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dangerButton, styles.controlButton]}
              onPress={() => {
                void handleAddLocalMaterial('camera');
              }}
            >
              <Text style={styles.dangerButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.materialHelperText}>
            Arquivos internos e capturas pela camera ficam disponiveis nesta sessao.
            Links externos ficam salvos para reabrir depois.
          </Text>
        </View>

        {studyMaterials.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum material adicionado</Text>
            <Text style={styles.emptyText}>
              Use os botoes acima para trazer apostilas, PDFs, links, videos e fotos
              para o seu estudo.
            </Text>
          </View>
        ) : null}

        <View style={styles.toolList}>
          {studyMaterials.map((material) => (
            <View key={material.id} style={styles.materialCard}>
              <Text style={styles.articleCategory}>{getMaterialKindLabel(material.kind)}</Text>
              <Text style={styles.articleTitle}>{material.title}</Text>
              <Text style={styles.materialMetaText}>
                {material.storageMode === 'session'
                  ? 'Material local da sessao atual.'
                  : 'Material salvo para acessar novamente.'}
              </Text>
              <Text style={styles.materialMetaText} numberOfLines={2}>
                {material.url}
              </Text>
              <View style={styles.itemActionRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.compactControlButton]}
                  onPress={() => handleOpenMaterial(material)}
                >
                  <Text style={styles.secondaryButtonText}>Abrir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerButton, styles.compactControlButton]}
                  onPress={() => handleDeleteMaterial(material)}
                >
                  <Text style={styles.dangerButtonText}>Apagar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cursos</Text>
          <TouchableOpacity onPress={() => router.push('/pesquisar')}>
            <Text style={styles.sectionLink}>Acesso por area</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="Procurar curso"
          placeholderTextColor="#7D8597"
          style={styles.searchInput}
          value={courseSearch}
          onChangeText={setCourseSearch}
        />
        <View style={styles.chipRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddCourse}>
            <Text style={styles.secondaryButtonText}>Adicionar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleEditCourse}>
            <Text style={styles.secondaryButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleDeleteCourse}>
            <Text style={styles.secondaryButtonText}>Apagar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          {visibleCourses.map((course) => {
            const isActive = course.id === selectedCourse;

            return (
              <TouchableOpacity
                key={course.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCourse(course.id)}
              >
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {course.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {visibleCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum curso encontrado</Text>
              <Text style={styles.emptyText}>
                Tente buscar por pedagogia, matematica, filosofia ou biologia.
              </Text>
            </View>
          ) : null}
        </View>
        {(selectedCourseKnowledge || searchedCourseKnowledge) ? (
          <View style={styles.detailBodyCard}>
            <Text style={styles.sectionTitle}>
              Conhecimento de {(selectedCourseKnowledge || searchedCourseKnowledge)?.courseLabel}
            </Text>
            <Text style={styles.detailBodyText}>
              {(selectedCourseKnowledge || searchedCourseKnowledge)?.overview}
            </Text>
            {((selectedCourseKnowledge || searchedCourseKnowledge)?.focusAreas || []).map((item) => (
              <Text key={item} style={styles.helperBullet}>
                - {item}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.quickStatsRow}>
        <MetricCard
          value={String(savedContentCount).padStart(2, '0')}
          label="Conteudos salvos"
          accent="blue"
        />
        <MetricCard value={weeklyStudyHours} label="Horas esta semana" accent="orange" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Horario semanal</Text>
          <TouchableOpacity onPress={() => router.push('/agenda')}>
            <Text style={styles.sectionLink}>Abrir agenda</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentSearchCard}>
          {weeklySchedule.map((slot) => (
            <TouchableOpacity
              key={`${slot.day}-${slot.subject}`}
              style={styles.recentSearchItem}
              onPress={() => {
                addTask(`Revisar ${slot.subject}`);
                setFeedbackMessage(`"${slot.subject}" foi adicionado na sua lista de tarefas.`);
              }}
            >
              <View>
                <Text style={styles.recentSearchText}>{slot.day}</Text>
                <Text style={styles.recentSearchCourse}>{slot.subject}</Text>
              </View>
              <Text style={styles.recentSearchCourse}>{slot.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertas importantes</Text>
          <TouchableOpacity onPress={() => router.push('/agenda')}>
            <Text style={styles.sectionLink}>Abrir agenda</Text>
          </TouchableOpacity>
        </View>
        {importantNotifications.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.toolItem}
            onPress={() => handleOpenHomeAlert(item)}
          >
            <View style={styles.priorityPill}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
            <Text style={styles.toolTitle}>{item.title}</Text>
            <Text style={styles.toolText}>{item.detail}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Destaques</Text>
          <TouchableOpacity onPress={() => router.push('/pesquisar')}>
            <Text style={styles.sectionLink}>Ver tudo</Text>
          </TouchableOpacity>
        </View>

        {filteredHighlights.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.highlightCard}
            onPress={() => router.push(`/artigo/${item.id}`)}
          >
            <View style={styles.highlightGlow} />
            <Text style={styles.highlightType}>{item.type}</Text>
            <Text style={styles.highlightTitle}>{item.title}</Text>
            <Text style={styles.highlightMeta}>{item.meta}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explorar conteudos</Text>
        <View style={styles.discoveryGrid}>
          {discoveries.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.discoveryCard}
              onPress={() => {
                discoveryActions[item]?.();
                setFeedbackMessage(`Abrindo ${item.toLowerCase()}.`);
                if (item === 'Artigos cientificos' || item === 'Pesquisas academicas') {
                  router.replace('/pesquisar');
                }
              }}
            >
              <Text style={styles.discoveryTitle}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pesquisa por curso</Text>
          <Text style={styles.sectionLink}>{recommendedArticles.length} materiais</Text>
        </View>
        {recommendedArticles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => router.push(`/artigo/${article.id}`)}
          >
            <Text style={styles.articleCategory}>{article.course}</Text>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleDescription}>{article.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Provas e trabalhos</Text>
          <TouchableOpacity onPress={() => router.push('/agenda')}>
            <Text style={styles.sectionLink}>Separados por cor</Text>
          </TouchableOpacity>
        </View>
        {assessments.map((assessment) => (
          <TouchableOpacity
            key={assessment.id}
            style={styles.assessmentCard}
            onPress={() => router.push('/agenda')}
          >
            <View
              style={[
                styles.assessmentStripe,
                { backgroundColor: assessment.color },
              ]}
            />
            <View style={styles.assessmentBody}>
              <Text style={styles.articleTitle}>{assessment.title}</Text>
              <Text style={styles.articleDescription}>
                {assessment.subject} | {assessment.type} | {assessment.dueDate}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lista de tarefas</Text>
          <Text style={styles.sectionLink}>Hoje</Text>
        </View>
        <View style={styles.taskList}>
          {customTasks.map((task, index) => (
            <View key={`${task}-${index}`} style={styles.taskItem}>
              <View style={styles.taskCheck} />
              <Text style={styles.taskText}>{task}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

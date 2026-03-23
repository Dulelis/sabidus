import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  articles,
  assessments,
  discoveries,
  highlightTopics,
  weeklySchedule,
} from '../data/mockData';
import {
  buildDiscoveryFallbackQuery,
  getDiscoveryProfile,
} from '../lib/discoveryProfiles';
import {
  buildMaterialLabelFromLink,
  createMaterialFromCameraAsset,
  createMaterialFromDocumentAsset,
  deleteStoredMaterialFile,
  getMaterialKindLabel,
  normalizeMaterialUrlInput,
  openStudyMaterialUrl,
} from '../lib/studyMaterials';
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

type HomeAlert = {
  id: string;
  title: string;
  detail: string;
  priority: 'Alta' | 'Media' | 'Baixa';
  target: 'agenda' | 'inicio';
};

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
    updateStudyMaterial,
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
  const [materialKind, setMaterialKind] = useState<'arquivo-externo' | 'link'>('link');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [isManagingMaterial, setIsManagingMaterial] = useState(false);

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
  const editingMaterial =
    studyMaterials.find((material) => material.id === editingMaterialId) || null;
  const activeManualMaterialKind =
    editingMaterial?.kind === 'arquivo-externo' || editingMaterial?.kind === 'link'
      ? editingMaterial.kind
      : materialKind;
  const isEditingLocalMaterial =
    editingMaterial?.kind === 'arquivo' || editingMaterial?.kind === 'camera';

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
        query: buildDiscoveryFallbackQuery('scientific-articles', {
          currentQuery: query,
          desiredCourse,
          selectedCourseLabel,
        }),
        course: selectedCourse,
        mode: 'scientific-articles',
        filters: getDiscoveryProfile('scientific-articles').filters.map((item) => item.id),
      }),
    'Pesquisas academicas': () =>
      openSearchTheme({
        query: buildDiscoveryFallbackQuery('academic-research', {
          currentQuery: query,
          desiredCourse,
          selectedCourseLabel,
        }),
        course: selectedCourse,
        mode: 'academic-research',
        filters: getDiscoveryProfile('academic-research').filters.map((item) => item.id),
      }),
    'Canais para assistir': () =>
      openSearchTheme({
        query: buildDiscoveryFallbackQuery('channels', {
          currentQuery: query,
          desiredCourse,
          selectedCourseLabel,
        }),
        course: selectedCourse,
        mode: 'channels',
        filters: ['aulas-completas', 'canais-br'],
      }),
    'Modelos de trabalhos': () =>
      openSearchTheme({
        query: buildDiscoveryFallbackQuery('work-models', {
          currentQuery: query,
          desiredCourse,
          selectedCourseLabel,
        }),
        course: selectedCourse,
        mode: 'work-models',
        filters: ['artigo', 'seminario'],
      }),
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

  function resetMaterialForm(nextKind: 'arquivo-externo' | 'link' = 'link') {
    setMaterialTitle('');
    setMaterialLink('');
    setMaterialKind(nextKind);
    setEditingMaterialId(null);
  }

  function handleStartEditingMaterial(material: StudyMaterial) {
    setEditingMaterialId(material.id);
    setMaterialTitle(material.title);
    setMaterialLink(material.url);

    if (material.kind === 'arquivo-externo' || material.kind === 'link') {
      setMaterialKind(material.kind);
    }

    setFeedbackMessage(`Editando "${material.title}". Ajuste e salve quando terminar.`);
  }

  function handleCancelMaterialEdit() {
    resetMaterialForm(materialKind);
    setFeedbackMessage('Edicao do material cancelada.');
  }

  function handleSaveMaterialFromForm() {
    const normalizedLink = normalizeMaterialUrlInput(materialLink);
    const resolvedKind =
      editingMaterial?.kind === 'arquivo' || editingMaterial?.kind === 'camera'
        ? editingMaterial.kind
        : activeManualMaterialKind;
    const resolvedTitle = materialTitle.trim() || buildMaterialLabelFromLink(normalizedLink);

    if (!normalizedLink) {
      setFeedbackMessage('Informe um link, download ou endereco do material antes de salvar.');
      return;
    }

    if (editingMaterial) {
      const updateResult = updateStudyMaterial({
        id: editingMaterial.id,
        title: resolvedTitle,
        kind: resolvedKind,
        url: normalizedLink,
        mimeType:
          editingMaterial.mimeType ||
          (resolvedKind === 'arquivo-externo' ? 'application/octet-stream' : 'text/html'),
        storageMode: editingMaterial.storageMode,
      });

      if (updateResult === 'duplicate') {
        setFeedbackMessage('Ja existe outro material com esse mesmo endereco.');
        return;
      }

      if (updateResult === 'invalid') {
        setFeedbackMessage('Nao foi possivel salvar essa edicao.');
        return;
      }

      resetMaterialForm(activeManualMaterialKind);
      setFeedbackMessage(`Material "${resolvedTitle}" atualizado com sucesso.`);
      return;
    }

    const createdMaterial = addStudyMaterial({
      title: resolvedTitle,
      kind: resolvedKind,
      url: normalizedLink,
      mimeType:
        resolvedKind === 'arquivo-externo' ? 'application/octet-stream' : 'text/html',
      storageMode: 'persisted',
    });

    if (!createdMaterial) {
      setFeedbackMessage('Esse material ja foi salvo ou o endereco esta incompleto.');
      return;
    }

    resetMaterialForm(activeManualMaterialKind);
    setFeedbackMessage(`Material "${createdMaterial.title}" salvo na biblioteca do aparelho.`);
  }

  async function handlePickInternalMaterial() {
    setIsManagingMaterial(true);

    try {
      const pickedResult = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });

      if (pickedResult.canceled || !pickedResult.assets?.[0]) {
        setFeedbackMessage('Nenhum arquivo interno foi selecionado.');
        return;
      }

      const preparedMaterial = await createMaterialFromDocumentAsset(pickedResult.assets[0]);
      const createdMaterial = addStudyMaterial({
        title: materialTitle.trim() || preparedMaterial.title,
        kind: 'arquivo',
        url: preparedMaterial.url,
        mimeType: preparedMaterial.mimeType,
        storageMode: preparedMaterial.storageMode,
      });

      if (!createdMaterial) {
        await deleteStoredMaterialFile(preparedMaterial.url);
        setFeedbackMessage('Esse arquivo ja esta salvo ou nao pode ser adicionado.');
        return;
      }

      resetMaterialForm(activeManualMaterialKind);
      setFeedbackMessage(`Arquivo "${createdMaterial.title}" copiado e salvo no aparelho.`);
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel selecionar um arquivo interno agora.'
      );
    } finally {
      setIsManagingMaterial(false);
    }
  }

  async function handleCaptureMaterial() {
    setIsManagingMaterial(true);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setFeedbackMessage('Permita o uso da camera para registrar um material.');
        return;
      }

      const captureResult = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        cameraType: ImagePicker.CameraType.back,
        mediaTypes: ['images'],
        quality: 1,
      });

      if (captureResult.canceled || !captureResult.assets?.[0]) {
        setFeedbackMessage('Nenhuma captura foi registrada.');
        return;
      }

      const preparedMaterial = await createMaterialFromCameraAsset(captureResult.assets[0]);
      const createdMaterial = addStudyMaterial({
        title: materialTitle.trim() || preparedMaterial.title,
        kind: 'camera',
        url: preparedMaterial.url,
        mimeType: preparedMaterial.mimeType,
        storageMode: preparedMaterial.storageMode,
      });

      if (!createdMaterial) {
        await deleteStoredMaterialFile(preparedMaterial.url);
        setFeedbackMessage('Nao foi possivel salvar essa captura agora.');
        return;
      }

      resetMaterialForm(activeManualMaterialKind);
      setFeedbackMessage(`Captura "${createdMaterial.title}" salva para estudo.`);
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel abrir a camera agora.'
      );
    } finally {
      setIsManagingMaterial(false);
    }
  }

  function handleOpenMaterial(material: StudyMaterial) {
    void openStudyMaterialUrl(material.url).catch((error) => {
      setFeedbackMessage(
        error instanceof Error ? error.message : 'Nao foi possivel abrir esse material.'
      );
    });
  }

  async function handleDeleteMaterial(material: StudyMaterial) {
    const wasDeleted = deleteStudyMaterial(material.id);

    if (!wasDeleted) {
      setFeedbackMessage('Nao foi possivel apagar esse material.');
      return;
    }

    try {
      await deleteStoredMaterialFile(material.url);
    } catch {
      // Keep the library state clean even if the file copy has already been removed.
    }

    if (editingMaterialId === material.id) {
      resetMaterialForm(activeManualMaterialKind);
    }

    setFeedbackMessage(`Material "${material.title}" removido da biblioteca.`);
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
          {editingMaterial ? (
            <View style={styles.savedSummaryCard}>
              <Text style={styles.savedSummaryText}>
                Editando {getMaterialKindLabel(editingMaterial.kind).toLowerCase()}:
                {' '}
                {editingMaterial.title}
              </Text>
            </View>
          ) : null}
          <Text style={styles.formLabel}>Titulo do material</Text>
          <TextInput
            placeholder="Ex: apostila de anatomia"
            placeholderTextColor="#7D8597"
            style={styles.searchInput}
            value={materialTitle}
            onChangeText={setMaterialTitle}
          />
          <Text style={styles.formLabel}>
            {isEditingLocalMaterial
              ? 'Endereco do arquivo salvo'
              : 'Link externo, download ou reuniao online'}
          </Text>
          <TextInput
            placeholder={
              isEditingLocalMaterial
                ? 'Arquivo salvo no aparelho'
                : 'Cole um link para artigo, PDF, Meet, Zoom ou video'
            }
            placeholderTextColor="#7D8597"
            style={styles.searchInput}
            value={materialLink}
            onChangeText={setMaterialLink}
            autoCapitalize="none"
            editable={!isEditingLocalMaterial}
          />
          {!isEditingLocalMaterial ? (
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, activeManualMaterialKind === 'link' && styles.chipActive]}
                onPress={() => setMaterialKind('link')}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeManualMaterialKind === 'link' && styles.chipTextActive,
                  ]}
                >
                  Link de estudo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  activeManualMaterialKind === 'arquivo-externo' && styles.chipActive,
                ]}
                onPress={() => setMaterialKind('arquivo-externo')}
              >
                <Text
                  style={[
                    styles.chipText,
                    activeManualMaterialKind === 'arquivo-externo' && styles.chipTextActive,
                  ]}
                >
                  Arquivo externo
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.searchButton, styles.controlButton]}
              onPress={handleSaveMaterialFromForm}
            >
              <Text style={styles.searchButtonText}>
                {editingMaterial ? 'Salvar edicao' : 'Gravar material'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.controlButton]}
              onPress={handlePickInternalMaterial}
            >
              <Text style={styles.secondaryButtonText}>
                {isManagingMaterial ? 'Abrindo...' : 'Arquivo interno'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.controlButton]}
              onPress={handleCaptureMaterial}
            >
              <Text style={styles.secondaryButtonText}>
                {isManagingMaterial ? 'Abrindo...' : 'Camera'}
              </Text>
            </TouchableOpacity>
            {editingMaterial ? (
              <TouchableOpacity
                style={[styles.dangerButton, styles.controlButton]}
                onPress={handleCancelMaterialEdit}
              >
                <Text style={styles.dangerButtonText}>Cancelar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.materialHelperText}>
            Arquivos internos escolhidos no aparelho sao copiados para a biblioteca do app.
            Links, downloads, reunioes online e videos podem ser gravados, editados, abertos e
            excluidos daqui.
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
                  style={[styles.searchButton, styles.compactControlButton]}
                  onPress={() => handleStartEditingMaterial(material)}
                >
                  <Text style={styles.searchButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerButton, styles.compactControlButton]}
                  onPress={() => {
                    void handleDeleteMaterial(material);
                  }}
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
                router.replace('/pesquisar');
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

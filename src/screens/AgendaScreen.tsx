import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { agenda } from '../data/mockData';
import { styles } from '../styles/appStyles';
import { useStudy } from '../context/StudyContext';
import type { AssessmentItem } from '../types/app';

export function AgendaScreen() {
  const {
    calendarItems,
    addCalendarItem,
    updateCalendarItem,
    deleteCalendarItem,
    customTasks,
    addTask,
    updateTask,
    deleteTask,
    clearTasks,
  } = useStudy();
  const [taskInput, setTaskInput] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventSubject, setEventSubject] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<'Prova' | 'Trabalho'>('Prova');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState(
    'Use esta tela para transformar ideias em tarefas e compromissos.'
  );

  const upcomingCount = calendarItems.length;
  const taskCount = customTasks.length;

  function resetTaskForm(message?: string) {
    setTaskInput('');
    setEditingTask(null);

    if (message) {
      setFeedbackMessage(message);
    }
  }

  function resetEventForm(message?: string) {
    setEventTitle('');
    setEventSubject('');
    setEventDate('');
    setEventType('Prova');
    setEditingEventId(null);

    if (message) {
      setFeedbackMessage(message);
    }
  }

  function handleAddTask() {
    if (!taskInput.trim()) {
      setFeedbackMessage('Digite uma tarefa antes de adicionar.');
      return;
    }

    const wasAdded = addTask(taskInput);

    if (!wasAdded) {
      setFeedbackMessage('Essa tarefa ja existe na sua agenda.');
      return;
    }

    const normalizedTask = taskInput.trim();
    resetTaskForm(`Tarefa "${normalizedTask}" adicionada com sucesso.`);
  }

  function handleUpdateTask() {
    if (!editingTask) {
      setFeedbackMessage('Escolha uma tarefa existente para editar.');
      return;
    }

    const result = updateTask(editingTask, taskInput);

    if (result === 'invalid') {
      setFeedbackMessage('Digite um novo texto para salvar a tarefa.');
      return;
    }

    if (result === 'duplicate') {
      setFeedbackMessage('Ja existe outra tarefa com esse mesmo nome.');
      return;
    }

    const normalizedTask = taskInput.trim();
    resetTaskForm(`Tarefa atualizada para "${normalizedTask}".`);
  }

  function handleDeleteTask(task: string) {
    const wasDeleted = deleteTask(task);

    if (!wasDeleted) {
      setFeedbackMessage('Nao foi possivel apagar essa tarefa.');
      return;
    }

    if (editingTask?.toLowerCase() === task.trim().toLowerCase()) {
      resetTaskForm(`Tarefa "${task}" apagada.`);
      return;
    }

    setFeedbackMessage(`Tarefa "${task}" apagada.`);
  }

  function handleStartTaskEdit(task: string) {
    setEditingTask(task);
    setTaskInput(task);
    setFeedbackMessage(`Editando a tarefa "${task}".`);
  }

  function handleAddEvent() {
    if (!eventTitle.trim() || !eventSubject.trim() || !eventDate.trim()) {
      setFeedbackMessage('Preencha titulo, materia e data antes de salvar o evento.');
      return;
    }

    const createdEvent = addCalendarItem({
      title: eventTitle,
      subject: eventSubject,
      type: eventType,
      dueDate: eventDate,
    });

    if (!createdEvent) {
      setFeedbackMessage('Nao foi possivel salvar o evento.');
      return;
    }

    resetEventForm(`${eventType} "${createdEvent.title}" salva para ${createdEvent.dueDate}.`);
  }

  function handleUpdateEvent() {
    if (!editingEventId) {
      setFeedbackMessage('Escolha um evento existente para editar.');
      return;
    }

    const updatedEvent = updateCalendarItem(editingEventId, {
      title: eventTitle,
      subject: eventSubject,
      type: eventType,
      dueDate: eventDate,
    });

    if (!updatedEvent) {
      setFeedbackMessage('Preencha todos os campos antes de editar o evento.');
      return;
    }

    resetEventForm(
      `${updatedEvent.type} "${updatedEvent.title}" atualizada para ${updatedEvent.dueDate}.`
    );
  }

  function handleDeleteEvent(assessment: AssessmentItem) {
    const wasDeleted = deleteCalendarItem(assessment.id);

    if (!wasDeleted) {
      setFeedbackMessage('Nao foi possivel apagar esse evento.');
      return;
    }

    if (editingEventId === assessment.id) {
      resetEventForm(`${assessment.type} "${assessment.title}" apagada.`);
      return;
    }

    setFeedbackMessage(`${assessment.type} "${assessment.title}" apagada.`);
  }

  function handleStartEventEdit(assessment: AssessmentItem) {
    setEditingEventId(assessment.id);
    setEventTitle(assessment.title);
    setEventSubject(assessment.subject);
    setEventDate(assessment.dueDate);
    setEventType(assessment.type);
    setFeedbackMessage(`Editando ${assessment.type.toLowerCase()} "${assessment.title}".`);
  }

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.screenTitle}>Agenda de estudos</Text>
        <Text style={styles.screenSubtitle}>
          Organize a semana e mantenha o ritmo das revisoes.
        </Text>
      </View>

      <View style={styles.savedSummaryCard}>
        <Text style={styles.savedSummaryText}>Tarefas registradas: {taskCount}</Text>
        <Text style={styles.savedSummaryText}>Eventos no calendario: {upcomingCount}</Text>
        <Text style={styles.savedSummaryText}>{feedbackMessage}</Text>
      </View>

      <View style={styles.agendaCard}>
        {agenda.map((item) => (
          <View key={`${item.day}-${item.focus}`} style={styles.agendaRow}>
            <View style={styles.dayPill}>
              <Text style={styles.dayPillText}>{item.day}</Text>
            </View>
            <View style={styles.agendaInfo}>
              <Text style={styles.agendaText}>{item.focus}</Text>
              <Text style={styles.agendaTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Adicionar tarefa escolar</Text>
          <TouchableOpacity
            onPress={() => {
              clearTasks();
              resetTaskForm('Todas as tarefas foram removidas.');
            }}
          >
            <Text style={styles.sectionLink}>Limpar tarefas</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>
            {editingTask ? 'Editar tarefa selecionada' : 'Nova tarefa'}
          </Text>
          <TextInput
            style={styles.searchInput}
            value={taskInput}
            onChangeText={setTaskInput}
            placeholder="Ex: estudar conjuntos numericos"
            placeholderTextColor="#7D8597"
          />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.searchButton, styles.controlButton]}
              onPress={editingTask ? handleUpdateTask : handleAddTask}
            >
              <Text style={styles.searchButtonText}>
                {editingTask ? 'Salvar edicao' : 'Adicionar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.controlButton]}
              onPress={() =>
                resetTaskForm(
                  editingTask
                    ? 'Edicao da tarefa cancelada.'
                    : 'Campo de tarefa liberado para uma nova anotacao.'
                )
              }
            >
              <Text style={styles.secondaryButtonText}>
                {editingTask ? 'Cancelar' : 'Limpar campo'}
              </Text>
            </TouchableOpacity>
            {editingTask ? (
              <TouchableOpacity
                style={[styles.dangerButton, styles.controlButton]}
                onPress={() => handleDeleteTask(editingTask)}
              >
                <Text style={styles.dangerButtonText}>Apagar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <View style={styles.taskList}>
          {customTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhuma tarefa cadastrada</Text>
              <Text style={styles.emptyText}>
                Adicione tarefas para acompanhar exercicios, revisoes e entregas.
              </Text>
            </View>
          ) : null}
          {customTasks.map((task, index) => (
            <View
              key={`${task}-${index}`}
              style={[
                styles.taskCard,
                editingTask?.toLowerCase() === task.toLowerCase() && styles.taskCardActive,
              ]}
            >
              <View style={styles.taskItem}>
                <View style={styles.taskCheck} />
                <View style={styles.taskBody}>
                  <Text style={styles.taskText}>{task}</Text>
                  <Text style={styles.taskMeta}>
                    {editingTask?.toLowerCase() === task.toLowerCase()
                      ? 'Tarefa carregada no formulario para edicao.'
                      : 'Use os botoes abaixo para editar ou apagar esta tarefa.'}
                  </Text>
                </View>
              </View>
              <View style={styles.itemActionRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.compactControlButton]}
                  onPress={() => handleStartTaskEdit(task)}
                >
                  <Text style={styles.secondaryButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerButton, styles.compactControlButton]}
                  onPress={() => handleDeleteTask(task)}
                >
                  <Text style={styles.dangerButtonText}>Apagar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calendario estudantil</Text>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>
            {editingEventId ? 'Editar evento selecionado' : 'Titulo do evento'}
          </Text>
          <TextInput
            style={styles.searchInput}
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholder="Ex: prova de matematica"
            placeholderTextColor="#7D8597"
          />
          <Text style={styles.formLabel}>Materia</Text>
          <TextInput
            style={styles.searchInput}
            value={eventSubject}
            onChangeText={setEventSubject}
            placeholder="Ex: matematica"
            placeholderTextColor="#7D8597"
          />
          <View style={styles.chipRow}>
            {(['Prova', 'Trabalho'] as const).map((type) => {
              const isActive = eventType === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setEventType(type)}
                >
                  <Text
                    style={[styles.chipText, isActive && styles.chipTextActive]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.formLabel}>Data</Text>
          <TextInput
            style={styles.searchInput}
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="Ex: 31/03/2026"
            placeholderTextColor="#7D8597"
          />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.searchButton, styles.controlButton]}
              onPress={editingEventId ? handleUpdateEvent : handleAddEvent}
            >
              <Text style={styles.searchButtonText}>
                {editingEventId ? 'Salvar edicao' : 'Adicionar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.controlButton]}
              onPress={() =>
                resetEventForm(
                  editingEventId
                    ? 'Edicao do evento cancelada.'
                    : 'Campos do evento liberados para um novo cadastro.'
                )
              }
            >
              <Text style={styles.secondaryButtonText}>
                {editingEventId ? 'Cancelar' : 'Limpar campos'}
              </Text>
            </TouchableOpacity>
            {editingEventId ? (
              <TouchableOpacity
                style={[styles.dangerButton, styles.controlButton]}
                onPress={() => {
                  const currentEvent = calendarItems.find((item) => item.id === editingEventId);

                  if (!currentEvent) {
                    setFeedbackMessage('Esse evento nao esta mais disponivel para apagar.');
                    return;
                  }

                  handleDeleteEvent(currentEvent);
                }}
              >
                <Text style={styles.dangerButtonText}>Apagar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {calendarItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum evento cadastrado</Text>
            <Text style={styles.emptyText}>
              Registre provas e trabalhos para acompanhar o calendario da semana.
            </Text>
          </View>
        ) : null}

        {calendarItems.map((assessment) => (
          <View
            key={assessment.id}
            style={[
              styles.assessmentCard,
              editingEventId === assessment.id && styles.assessmentCardActive,
            ]}
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
              <View style={styles.itemActionRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.compactControlButton]}
                  onPress={() => handleStartEventEdit(assessment)}
                >
                  <Text style={styles.secondaryButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerButton, styles.compactControlButton]}
                  onPress={() => handleDeleteEvent(assessment)}
                >
                  <Text style={styles.dangerButtonText}>Apagar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

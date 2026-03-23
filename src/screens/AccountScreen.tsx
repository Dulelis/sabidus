import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { accountStats, articles, studentProfile } from '../data/mockData';
import { styles } from '../styles/appStyles';
import { useStudy } from '../context/StudyContext';

export function AccountScreen() {
  const {
    savedArticleIds,
    recentSearches,
    customPerformance,
    addPerformanceEntry,
    customSummaries,
    addSummaryNote,
    desiredCourse,
    setDesiredCourse,
  } = useStudy();
  const savedArticles = articles.filter((article) =>
    savedArticleIds.includes(article.id)
  );
  const focusCourses = Array.from(new Set(savedArticles.map((item) => item.course)));

  const [subjectInput, setSubjectInput] = useState('');
  const [gradeInput, setGradeInput] = useState('');
  const [summarySubject, setSummarySubject] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [summaryQuestion, setSummaryQuestion] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(
    'Sua conta concentra materiais salvos, desempenho e resumos.'
  );

  return (
    <>
      <View style={styles.profileCard}>
        <View>
          <Text style={styles.profileLabel}>Sua conta</Text>
          <Text style={styles.profileName}>{studentProfile.name}</Text>
          <Text style={styles.profileHandle}>{studentProfile.handle}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsValue}>2480</Text>
          <Text style={styles.pointsLabel}>Pontos</Text>
        </View>
      </View>

      <View style={styles.savedSummaryCard}>
        <Text style={styles.savedSummaryText}>Materiais salvos: {savedArticles.length}</Text>
        <Text style={styles.savedSummaryText}>Buscas recentes: {recentSearches.length}</Text>
        <Text style={styles.savedSummaryText}>Resumos cadastrados: {customSummaries.length}</Text>
        <Text style={styles.savedSummaryText}>{feedbackMessage}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.accountGrid}>
          {accountStats.map((item) => (
            <View key={item.label} style={styles.accountCard}>
              <Text style={styles.accountValue}>{item.value}</Text>
              <Text style={styles.accountLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ferramentas</Text>
        <View style={styles.toolList}>
          <View style={styles.toolItem}>
            <Text style={styles.toolTitle}>Calculadoras</Text>
            <Text style={styles.toolText}>
              Area reservada para ferramentas rapidas de estudo.
            </Text>
          </View>
          <View style={styles.toolItem}>
            <Text style={styles.toolTitle}>Modelos de trabalhos</Text>
            <Text style={styles.toolText}>
              Espaco para organizar referencias e estruturas de entrega.
            </Text>
          </View>
          <View style={styles.toolItem}>
            <Text style={styles.toolTitle}>Acessos importantes</Text>
            <Text style={styles.toolText}>
              Matricula: {studentProfile.registration}
            </Text>
            <Text style={styles.toolText}>
              Portal: {studentProfile.portalAccess}
            </Text>
            <Text style={styles.formLabel}>Curso pretendido</Text>
            <TextInput
              style={styles.searchInput}
              value={desiredCourse}
              onChangeText={(value) => {
                setDesiredCourse(value);
                setFeedbackMessage('Curso pretendido atualizado.');
              }}
              placeholder={studentProfile.course}
              placeholderTextColor="#7D8597"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salvos e pesquisas</Text>
        <View style={styles.savedSummaryCard}>
          <Text style={styles.savedSummaryText}>
            Materiais salvos: {savedArticles.length}
          </Text>
          <Text style={styles.savedSummaryText}>
            Ultima busca: {recentSearches[0] ?? 'Nenhuma busca registrada'}
          </Text>
          <Text style={styles.savedSummaryText}>
            Cursos em foco:{' '}
            {focusCourses.length > 0
              ? focusCourses.join(', ')
              : 'Defina um curso e comece a salvar materiais'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Materiais salvos</Text>
        {savedArticles.length > 0 ? (
          savedArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => router.push(`/artigo/${article.id}`)}
            >
              <Text style={styles.articleCategory}>{article.course}</Text>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleDescription}>{article.description}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum material salvo ainda</Text>
            <Text style={styles.emptyText}>
              Abra um artigo e use o botao de salvar para montar sua biblioteca.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buscas recentes</Text>
        {recentSearches.length > 0 ? (
          <View style={styles.recentSearchCard}>
            {recentSearches.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.recentSearchItem}
                onPress={() =>
                  router.push({
                    pathname: '/pesquisar',
                    params: { query: term },
                  })
                }
              >
                <Text style={styles.recentSearchText}>{term}</Text>
                <Text style={styles.recentSearchCourse}>Abrir busca</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma busca salva</Text>
            <Text style={styles.emptyText}>
              Pesquise por tema ou materia para criar um historico de consultas.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desempenho escolar</Text>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Materia</Text>
          <TextInput
            style={styles.searchInput}
            value={subjectInput}
            onChangeText={setSubjectInput}
            placeholder="Ex: filosofia"
            placeholderTextColor="#7D8597"
          />
          <Text style={styles.formLabel}>Nota</Text>
          <TextInput
            style={styles.searchInput}
            value={gradeInput}
            onChangeText={setGradeInput}
            keyboardType="numeric"
            placeholder="Ex: 8.5"
            placeholderTextColor="#7D8597"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              if (!subjectInput.trim() || !gradeInput.trim()) {
                setFeedbackMessage('Informe materia e nota antes de registrar desempenho.');
                return;
              }

              addPerformanceEntry({ subject: subjectInput, grade: gradeInput });
              setFeedbackMessage(
                `Desempenho em ${subjectInput.trim()} registrado com nota ${gradeInput.trim()}.`
              );
              setSubjectInput('');
              setGradeInput('');
            }}
          >
            <Text style={styles.searchButtonText}>Adicionar nota</Text>
          </TouchableOpacity>
        </View>

        {customPerformance.map((item) => (
          <View key={`${item.subject}-${item.grade}`} style={styles.articleCard}>
            <Text style={styles.articleCategory}>{item.status}</Text>
            <Text style={styles.articleTitle}>{item.subject}</Text>
            <Text style={styles.articleDescription}>Nota atual: {item.grade}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumos pos-aula</Text>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Materia</Text>
          <TextInput
            style={styles.searchInput}
            value={summarySubject}
            onChangeText={setSummarySubject}
            placeholder="Ex: biologia"
            placeholderTextColor="#7D8597"
          />
          <Text style={styles.formLabel}>Resumo da aula</Text>
          <TextInput
            style={styles.textArea}
            value={summaryText}
            onChangeText={setSummaryText}
            multiline
            placeholder="Escreva o que foi passado na aula"
            placeholderTextColor="#7D8597"
          />
          <Text style={styles.formLabel}>O que nao entendi</Text>
          <TextInput
            style={styles.textArea}
            value={summaryQuestion}
            onChangeText={setSummaryQuestion}
            multiline
            placeholder="Registre as duvidas para revisar depois"
            placeholderTextColor="#7D8597"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              if (!summarySubject.trim() || !summaryText.trim()) {
                setFeedbackMessage('Preencha a materia e o resumo para salvar a anotacao.');
                return;
              }

              addSummaryNote({
                subject: summarySubject,
                summary: summaryText,
                openQuestions: summaryQuestion,
              });
              setFeedbackMessage(`Resumo de ${summarySubject.trim()} salvo com sucesso.`);
              setSummarySubject('');
              setSummaryText('');
              setSummaryQuestion('');
            }}
          >
            <Text style={styles.searchButtonText}>Salvar resumo</Text>
          </TouchableOpacity>
        </View>

        {customSummaries.map((note) => (
          <View key={note.id} style={styles.detailBodyCard}>
            <Text style={styles.articleCategory}>{note.subject}</Text>
            <Text style={styles.detailBodyText}>{note.summary}</Text>
            <Text style={styles.toolText}>Nao entendi: {note.openQuestions}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import {
  bookSuggestions,
  enemTopics,
  formulaGuides,
  resourceModules,
  simulatedExams,
  studyMethods,
  videoLessons,
} from '../data/mockData';
import { styles } from '../styles/appStyles';

export function ResourcesScreen() {
  function openResourceModule(id: string, focus?: string) {
    router.push({
      pathname: '/recurso/[id]',
      params: focus ? { id, focus } : { id },
    });
  }

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.screenTitle}>Recursos de estudo</Text>
        <Text style={styles.screenSubtitle}>
          Hub com videoaulas, metodos, formulas, leituras e funcoes academicas.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modulos do app</Text>
        {resourceModules.map((module) => (
          <TouchableOpacity
            key={module.id}
            style={styles.articleCard}
            onPress={() =>
              router.push({
                pathname: '/recurso/[id]',
                params: { id: module.id },
              })
            }
          >
            <Text style={styles.articleCategory}>{module.status}</Text>
            <Text style={styles.articleTitle}>{module.title}</Text>
            <Text style={styles.articleDescription}>{module.summary}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Videoaulas gratuitas</Text>
          <TouchableOpacity onPress={() => openResourceModule('videoaulas')}>
            <Text style={styles.sectionLink}>Abrir modulo</Text>
          </TouchableOpacity>
        </View>
        {videoLessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.sourceItem}
            onPress={() => openResourceModule('videoaulas', lesson.id)}
          >
            <Text style={styles.sourceName}>{lesson.title}</Text>
            <Text style={styles.sourceType}>
              {lesson.creator} | {lesson.platform} | {lesson.course} | {lesson.year}
            </Text>
            <Text style={styles.detailBodyText}>{lesson.creatorBio}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Metodos de estudo</Text>
          <TouchableOpacity onPress={() => openResourceModule('metodos-estudo')}>
            <Text style={styles.sectionLink}>Abrir modulo</Text>
          </TouchableOpacity>
        </View>
        {studyMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.planningCard}
            onPress={() => openResourceModule('metodos-estudo', method.id)}
          >
            <Text style={styles.planningTitle}>{method.title}</Text>
            <Text style={styles.planningText}>{method.description}</Text>
            <Text style={styles.detailBodyText}>{method.howItWorks}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Formulas guiadas</Text>
          <TouchableOpacity onPress={() => openResourceModule('formulas')}>
            <Text style={styles.sectionLink}>Abrir modulo</Text>
          </TouchableOpacity>
        </View>
        {formulaGuides.map((formula) => (
          <TouchableOpacity
            key={formula.id}
            style={styles.articleCard}
            onPress={() => openResourceModule('formulas', formula.id)}
          >
            <Text style={styles.articleCategory}>{formula.area}</Text>
            <Text style={styles.articleTitle}>{formula.title}</Text>
            <Text style={styles.articleDescription}>{formula.explanation}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Simulados prontos</Text>
          <TouchableOpacity onPress={() => openResourceModule('simulados')}>
            <Text style={styles.sectionLink}>Abrir modulo</Text>
          </TouchableOpacity>
        </View>
        {simulatedExams.map((exam) => (
          <TouchableOpacity
            key={exam.id}
            style={styles.articleCard}
            onPress={() => openResourceModule('simulados')}
          >
            <Text style={styles.articleCategory}>{exam.course}</Text>
            <Text style={styles.articleTitle}>{exam.title}</Text>
            <Text style={styles.articleDescription}>{exam.focus}</Text>
            <View style={styles.articleMetaRow}>
              <View style={styles.articleMetaPill}>
                <Text style={styles.articleMetaText}>{exam.questionCount}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Conteudos do ENEM</Text>
          <TouchableOpacity onPress={() => openResourceModule('enem')}>
            <Text style={styles.sectionLink}>Abrir modulo</Text>
          </TouchableOpacity>
        </View>
        {enemTopics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={styles.toolItem}
            onPress={() => openResourceModule('enem')}
          >
            <Text style={styles.toolTitle}>
              {topic.subject} | {topic.branch}
            </Text>
            <Text style={styles.toolText}>{topic.summary}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Livros recomendados</Text>
        {bookSuggestions.map((book) => (
          <View key={book.id} style={styles.toolItem}>
            <Text style={styles.toolTitle}>{book.title}</Text>
            <Text style={styles.articleCategory}>
              {book.author} | {book.course} | {book.year}
            </Text>
            <Text style={styles.toolText}>{book.authorBio}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

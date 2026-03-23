import { router, useLocalSearchParams } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { ScreenLayout } from '@/components/ScreenLayout';
import { findArticleById } from '@/data/mockData';
import { useStudy } from '@/context/StudyContext';
import { styles } from '@/styles/appStyles';

export default function ArticleDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = findArticleById(id);
  const { isSavedArticle, toggleSavedArticle } = useStudy();

  if (!article) {
    return (
      <ScreenLayout>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Conteudo nao encontrado</Text>
          <Text style={styles.emptyText}>
            O material que voce tentou abrir nao esta disponivel.
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.detailActions}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => toggleSavedArticle(article.id)}
        >
          <Text style={styles.searchButtonText}>
            {isSavedArticle(article.id) ? 'Remover dos salvos' : 'Salvar material'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: '/pesquisar',
              params: {
                query: article.title,
                course: article.course.toLowerCase(),
              },
            })
          }
        >
          <Text style={styles.secondaryButtonText}>Ver relacionados</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailHero}>
        <Text style={styles.articleCategory}>{article.course}</Text>
        <Text style={styles.detailTitle}>{article.title}</Text>
        <Text style={styles.detailDescription}>{article.description}</Text>
        <View style={styles.articleMetaRow}>
          <View style={styles.articleMetaPill}>
            <Text style={styles.articleMetaText}>{article.category}</Text>
          </View>
          <View style={styles.articleMetaPill}>
            <Text style={styles.articleMetaText}>{article.duration}</Text>
          </View>
          <View style={styles.articleMetaPill}>
            <Text style={styles.articleMetaText}>{article.source}</Text>
          </View>
          <View style={styles.articleMetaPill}>
            <Text style={styles.articleMetaText}>{article.year}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailBodyCard}>
        <Text style={styles.sectionTitle}>Resumo do material</Text>
        <Text style={styles.detailBodyText}>{article.body}</Text>
        <Text style={styles.sectionTitle}>Autor e contexto</Text>
        <Text style={styles.detailBodyText}>
          {article.author} ({article.year}) - {article.authorBio}
        </Text>
      </View>
    </ScreenLayout>
  );
}

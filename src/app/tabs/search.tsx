import { useCallback, useMemo, useState } from "react";
import { Text, TextInput, View, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getTrend, type Repository } from "../../lib/api-repo";
import { useAuth } from "../../context/AuthContext";
import { colors, textStyles } from "../../theme";

export default function Search() {
  const router = useRouter();
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getTrend(token)
        .then((res) => setRepos(res.data))
        .catch(() => setRepos([]))
        .finally(() => setIsLoading(false));
    }, [token])
  );

  const filteredRepos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return repos;
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(normalized) ||
        repo.description?.toLowerCase().includes(normalized) ||
        repo.owner.username.toLowerCase().includes(normalized)
    );
  }, [repos, query]);

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.inputBox}
        placeholder="レシピ名・投稿者で検索"
        value={query}
        onChangeText={setQuery}
      />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
          {filteredRepos.map((repo) => (
            <Pressable key={repo.id} style={styles.recipe} onPress={() => router.push(`/tabs/repo/${repo.id}`)}>
              {repo.thumbnail ? (
                <Image style={styles.recipeImage} source={{ uri: repo.thumbnail }} />
              ) : (
                <View style={[styles.recipeImage, styles.recipeImagePlaceholder]} />
              )}
              <View style={styles.recipeExplain}>
                <Text style={textStyles.h3Text}>{repo.name}</Text>
                <Text style={textStyles.text}>{repo.owner.username}</Text>
              </View>
            </Pressable>
          ))}
          {filteredRepos.length === 0 ? <Text style={textStyles.text}>該当するレシピが見つかりませんでした。</Text> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    gap: 20,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    alignContent: "center",
    gap: 20,
  },
  inputBox: {
    textAlign: "center",
    padding: 20,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    color: colors.onSurface,
  },
  recipe: {
    backgroundColor: colors.primary,
    height: 350,
    overflow: "hidden",
    borderRadius: 20,
  },
  recipeImage: {
    height: 200,
  },
  recipeImagePlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  recipeExplain: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.surfaceContainerLow,
  }
});

import { useCallback, useMemo, useState } from "react";
import { Text, TextInput, View, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getTrend, type Recipe } from "../../lib/api-recipe";
import { useAuth } from "../../context/AuthContext";
import { colors, textStyles } from "../../theme";

export default function Search() {
  const router = useRouter();
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getTrend(token)
        .then((res) => setRecipes(res.data))
        .catch(() => setRecipes([]))
        .finally(() => setIsLoading(false));
    }, [token])
  );

  const filteredRecipes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return recipes;
    return recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(normalized) ||
        recipe.description?.toLowerCase().includes(normalized) ||
        recipe.owner.username.toLowerCase().includes(normalized)
    );
  }, [recipes, query]);

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
          {filteredRecipes.map((recipe) => (
            <Pressable key={recipe.id} style={styles.recipe} onPress={() => router.push(`/tabs/recipe/${recipe.id}`)}>
              {recipe.thumbnail ? (
                <Image style={styles.recipeImage} source={{ uri: recipe.thumbnail }} />
              ) : (
                <View style={[styles.recipeImage, styles.recipeImagePlaceholder]} />
              )}
              <View style={styles.recipeExplain}>
                <Text style={textStyles.h3Text}>{recipe.name}</Text>
                <Text style={textStyles.text}>{recipe.owner.username}</Text>
              </View>
            </Pressable>
          ))}
          {filteredRecipes.length === 0 ? <Text style={textStyles.text}>該当するレシピが見つかりませんでした。</Text> : null}
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

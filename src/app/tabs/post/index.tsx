import { useCallback, useState } from "react";
import { Text, View, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../../theme";
import { useAuth } from "../../../context/AuthContext";
import { getUserRecipe, type Recipe } from "../../../lib/api-recipe";
import { RecipeStateBadges } from "../../../components/RecipeStateBadges";


export default function PostList() {
  const router = useRouter();
  const { token } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setRecipes([]);
        setIsLoading(false);
        return;
      }
      let cancelled = false;
      setIsLoading(true);
      getUserRecipe(token)
        .then((res) => {
          if (!cancelled) setRecipes(res.data);
        })
        .catch(() => {
          if (!cancelled) setRecipes([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [token])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>投稿</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Pressable style={styles.newButton} onPress={() => router.push("/tabs/post/write")}>
          <MaterialIcons name="add" size={20} color={colors.linenCream} />
          <Text style={styles.newButtonText}>新規レシピを作成</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>自分のレシピ</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.roastedBean} />
        ) : (
          <View style={styles.draftList}>
            {recipes.map((recipe) => (
              <Pressable
                key={recipe.id}
                style={styles.draftCard}
                onPress={() => router.push({ pathname: "/tabs/post/write", params: { id: String(recipe.id) } })}
              >
                {recipe.thumbnail ? (
                  <Image style={styles.draftThumbnail} source={{ uri: recipe.thumbnail }} />
                ) : (
                  <View style={styles.draftThumbnail} />
                )}
                <View style={styles.draftInfo}>
                  <Text style={styles.draftTitle}>{recipe.name}</Text>
                  <RecipeStateBadges recipe={recipe} showFork />
                  <Text style={styles.draftMeta}>
                    最終更新: {new Date(recipe.updated_at).toLocaleDateString("ja-JP")}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
              </Pressable>
            ))}
            {recipes.length === 0 ? <Text style={styles.emptyText}>まだレシピがありません。</Text> : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.roastedBean,
  },
  newButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.linenCream,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  emptyText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: 12,
  },
  draftList: {
    gap: 10,
  },
  draftCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  draftThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainer,
  },
  draftInfo: {
    flex: 1,
    gap: 2,
  },
  draftTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurface,
  },
  draftMeta: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
});

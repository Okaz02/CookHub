import { useCallback, useMemo, useState } from "react";
import { Text, View, Image, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getUserRecipe, type Recipe } from "../../lib/api-recipe";
import { RecipeStateBadges } from "../../components/RecipeStateBadges";
import { colors, textStyles } from "../../theme";

function RecipeListRoute({ recipes, emptyText }: { recipes: Recipe[]; emptyText: string }) {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {recipes.map((recipe) => (
        <Pressable key={recipe.id} style={styles.recipe} onPress={() => router.push(`/tabs/recipe/${recipe.id}`)}>
          {recipe.thumbnail ? (
            <Image style={styles.recipeImage} source={{ uri: recipe.thumbnail }} />
          ) : (
            <View style={[styles.recipeImage, styles.recipeImagePlaceholder]} />
          )}
          <View style={styles.recipeExplain}>
            <Text style={textStyles.h3Text}>{recipe.name}</Text>
            <RecipeStateBadges recipe={recipe} />
          </View>
        </Pressable>
      ))}
      {recipes.length === 0 ? <Text style={styles.emptyText}>{emptyText}</Text> : null}
    </ScrollView>
  );
}

function ProposalsRoute() {
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.emptyText}>採択提案の一覧はまだ準備中です。</Text>
    </ScrollView>
  );
}

export default function Profile() {
  const layout = useWindowDimensions();
  const router = useRouter();
  const { account, token, signOut } = useAuth();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "recipes", title: "レシピ" },
    { key: "arrangements", title: "アレンジ" },
    { key: "proposals", title: "採択提案" },
  ]);

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

  const ownRecipes = useMemo(() => recipes.filter((recipe) => !recipe.fork), [recipes]);
  const forkedRecipes = useMemo(() => recipes.filter((recipe) => recipe.fork), [recipes]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const renderScene = SceneMap({
    recipes: () => <RecipeListRoute recipes={ownRecipes} emptyText="まだレシピがありません。" />,
    arrangements: () => <RecipeListRoute recipes={forkedRecipes} emptyText="まだアレンジしたレシピがありません。" />,
    proposals: ProposalsRoute,
  });

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.profile}>
        <View style={styles.profileMain}>
          <Image style={styles.profileIcon}></Image>
          <View style={styles.profileName}>
            <Text style={textStyles.h2Text}>{account?.username ?? "ゲスト"}</Text>
            <Text style={textStyles.h4Text}>{account?.email ?? ""}</Text>
          </View>
          <Pressable onPress={handleSignOut}>
            <Text style={styles.signOutText}>ログアウト</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.profileStatus}>
            <View style={styles.profileStatusItem}>
              <Text style={textStyles.h2Text}>{ownRecipes.length}</Text>
              <Text style={textStyles.text}>レシピ</Text>
            </View>
            <View style={styles.lineHorizontal} />
            <View style={styles.profileStatusItem}>
              <Text style={textStyles.h2Text}>{forkedRecipes.length}</Text>
              <Text style={styles.statusLabel}>アレンジ</Text>
            </View>
          </View>
        )}
      </View>

      <TabView
        style={styles.tabView}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            activeColor={colors.primary}
            inactiveColor={colors.outline}
          />
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    alignContent: "center",
    gap: 20,
    padding: 20,
  },
  lineVertical: {
    borderBottomColor: colors.outlineVariant,
    borderBottomWidth: 1,
  },
  lineHorizontal: {
    borderLeftColor: colors.outlineVariant,
    borderLeftWidth: 1,
    height: "100%",
  },
  profile: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: 20,
    borderRadius: 20,
    gap: 20,
  },
  profileMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileStatus: {
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  profileStatusItem: {
    alignItems: "center",
  },
  profileName: {
    flex: 1,
  },
  profileIcon: {
    backgroundColor: colors.primary,
    width: 70,
    height: 70,
    marginRight: 20,
    borderRadius: 35,
  },
  statusText: {
    color: colors.onSurface,
  },
  statusLabel: {
    color: colors.onSurfaceVariant,
  },
  signOutText: {
    fontSize: 12,
    color: colors.error,
  },
  emptyText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    padding: 20,
  },
  tabView: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    height: 500,
    borderRadius: 20,
  },
  tabBar: {
    backgroundColor: colors.surfaceContainerLowest,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
  },
  tabContent: {
    gap: 20,
    padding: 20,
  },
  listItem: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 20,
    borderRadius: 20,
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
    gap: 6,
    padding: 20,
    backgroundColor: colors.surfaceContainerLow,
  },
});

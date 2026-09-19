import { useCallback, useState } from "react";
import { Text, View, StyleSheet, TextInput, Pressable, ScrollView, Image } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getTrend, type Recipe } from "../../lib/api-recipe";
import { useAuth } from "../../context/AuthContext";
import { colors, textStyles } from "../../theme";

export default function Index() {
  const router = useRouter();
  const { token } = useAuth();
  const [trendRecipes, setTrendRecipes] = useState<Recipe[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTrend(token)
        .then((res) => setTrendRecipes(res.data))
        .catch(() => setTrendRecipes([]));
    }, [token])
  );

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={textStyles.h1Text}>世界のレシピを、みんなで改良。</Text>
      <Text style={textStyles.h3Text}>CookHubは、レシピの更新を記録したり、レシピを自分に合うようにアレンジ、より良いアレンジをもとのレシピに統合</Text>

      <Pressable style={styles.button} onPress={() => router.push("/tabs/post/write")}>
        <Text style={styles.buttonText}>+ レシピを作る</Text>
      </Pressable>

      <TextInput style={styles.inputBox} placeholder="レシピを検索" onFocus={() => router.push("/tabs/search")} />
      <View style={styles.rowBetween}>
        <Text style={textStyles.h2Text}>人気のレシピ</Text>
        <Pressable onPress={() => router.push("/tabs/search")}>
          <Text style={textStyles.text}>すべて見る</Text>
        </Pressable>
      </View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listContainer}>

        {trendRecipes.map((recipe) => (
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

        {trendRecipes.length === 0 ? <Text style={textStyles.text}>まだ公開されたレシピがありません。</Text> : null}

      </ScrollView>

      <View style={styles.rowBetween}>
        <Text style={textStyles.h2Text}>レシピの更新</Text>
        <Text style={textStyles.text}>すべて見る</Text>
      </View>

      <ScrollView style={styles.updateScrollView} contentContainerStyle={styles.listContainer}>

        <View style={styles.update}>
          <View style={styles.rowStartExpand}>
            <Image style={styles.userIcon} />
            <View style={styles.updateInfo}>
              <Text style={textStyles.h4Text}>田中さんがアレンジしました</Text>
              <Text style={textStyles.text}>10分前</Text>
              <View style={styles.updateMessage}>
                <Text style={textStyles.h4Text}>カレーのスパイスにクミンを追加しました。</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.update}>
          <View style={styles.rowStartExpand}>
            <Image style={styles.userIcon} />
            <View style={styles.updateInfo}>
              <Text style={textStyles.h4Text}>佐藤さんがアレンジしました</Text>
              <Text style={textStyles.text}>1時間前</Text>
              <View style={styles.updateMessage}>
                <Text style={textStyles.h4Text}>じゃがいもを大根に置き換えました。</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
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
  listContainer: {
    gap: 20,
  },
  updateScrollView: {
    maxHeight: 300,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowStartExpand: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  updateInfo: {
    flex: 1,
    alignSelf: "stretch",
  },
  button: {
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.roastedBean,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: colors.linenCream,
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
  userIcon: {
    height: 35,
    width: 35,
    borderRadius: 17.5,
    marginRight: 10,
    backgroundColor: colors.outline,
  },
  recipe: {
    backgroundColor: colors.primary,
    height: 350,
    width: 300,
    overflow: "hidden",
    borderRadius: 20,
  },
  recipeImage: {
    width: 300,
    height: 200,
  },
  recipeImagePlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  recipeExplain: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.surfaceContainerLow,
  },
  update: {
    height: 125,
    padding: 20,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 20,
  },
  updateMessage: {
    flex: 1,
    justifyContent: "center",
  },
});

import { useCallback, useState } from "react";
import { Text, View, StyleSheet, TextInput, Pressable, ScrollView, Image } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getTrend, type Repository } from "../../lib/api-repo"
import { useAuth } from "../../context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { token } = useAuth();
  const [trendRepos, setTrendRepos] = useState<Repository[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTrend(token)
        .then((res) => setTrendRepos(res.data))
        .catch(() => setTrendRepos([]));
    }, [token])
  );

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.h1Text}>世界のレシピを、みんなで改良。</Text>
      <Text style={styles.h3Text}>CookHubは、レシピの更新を記録したり、レシピを自分に合うようにアレンジ、より良いアレンジをもとのレシピに統合</Text>

      <Pressable style={styles.button} onPress={() => router.push("/tabs/post/write")}>
        <Text style={styles.buttonText}>+ レシピを作る</Text>
      </Pressable>

      <TextInput style={styles.inputBox} placeholder="レシピを検索" onFocus={() => router.push("/tabs/search")} />
      <View style={styles.rowBetween}>
        <Text style={styles.h2Text}>人気のレシピ</Text>
        <Pressable onPress={() => router.push("/tabs/search")}>
          <Text style={styles.text}>すべて見る</Text>
        </Pressable>
      </View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listContainer}>

        {trendRepos.map((repo) => (
          <Pressable key={repo.id} style={styles.recipe} onPress={() => router.push(`/tabs/repo/${repo.id}`)}>
            {repo.thumbnail ? (
              <Image style={styles.recipeImage} source={{ uri: repo.thumbnail }} />
            ) : (
              <View style={[styles.recipeImage, styles.recipeImagePlaceholder]} />
            )}
            <View style={styles.recipeExplain}>
              <Text style={styles.h3Text}>{repo.name}</Text>
              <Text style={styles.text}>{repo.owner.username}</Text>
            </View>
          </Pressable>
        ))}

        {trendRepos.length === 0 ? <Text style={styles.text}>まだ公開されたレシピがありません。</Text> : null}

      </ScrollView>

      <View style={styles.rowBetween}>
        <Text style={styles.h2Text}>レシピの更新</Text>
        <Text style={styles.text}>すべて見る</Text>
      </View>

      <ScrollView style={styles.updateScrollView} contentContainerStyle={styles.listContainer}>

        <View style={styles.update}>
          <View style={styles.rowStartExpand}>
            <Image style={styles.userIcon} />
            <View style={styles.updateInfo}>
              <Text style={styles.h4Text}>田中さんがアレンジしました</Text>
              <Text style={styles.text}>10分前</Text>
              <View style={styles.updateMessage}>
                <Text style={styles.h4Text}>カレーのスパイスにクミンを追加しました。</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.update}>
          <View style={styles.rowStartExpand}>
            <Image style={styles.userIcon} />
            <View style={styles.updateInfo}>
              <Text style={styles.h4Text}>佐藤さんがアレンジしました</Text>
              <Text style={styles.text}>1時間前</Text>
              <View style={styles.updateMessage}>
                <Text style={styles.h4Text}>じゃがいもを大根に置き換えました。</Text>
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
  },
  container: {
    alignContent: "center",
    gap: 20,
    padding: 20
  },
  listContainer: {
    gap: 20,
  },
  updateScrollView: {
    maxHeight: 300
  },
  h1Text: {
    fontSize: 40,
  },
  h2Text: {
    fontSize: 20,
  },
  h3Text: {
    fontSize: 15,
  },
  h4Text: {
    fontSize: 13,
  },
  text: {
    fontSize: 10
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  rowStartExpand: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start"
  },
  updateInfo: {
    flex: 1,
    alignSelf: "stretch"
  },
  button: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1b110f",
    justifyContent: "center",
    alignItems: "center"
  },
  buttonText: {
    color: "white"
  },
  inputBox: {
    textAlign: "center",
    padding: 20,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#b1b1b1",
    backgroundColor: "#dbdbdb"
  },
  userIcon: {
    height: 20,
    width: 20,
    borderRadius: 10
  },
  recipe: {
    backgroundColor: "black",
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
    backgroundColor: "#3a3a3a",
  },
  recipeExplain: {
    flex: 1,
    padding: 20,
    backgroundColor: "#dbdbdb"
  },
  update: {
    height: 125,
    padding: 20,
    backgroundColor: "#dbdbdb",
    borderRadius: 20
  },
  updateMessage: {
    flex: 1,
    justifyContent: "center"
  }
});

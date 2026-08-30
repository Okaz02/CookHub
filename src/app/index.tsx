import { Text, View, StyleSheet, TextInput, Pressable, ScrollView, Image } from "react-native";

export default function Index() {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.h1Text}>世界のレシピを、みんなで改良。</Text>
      <Text style={styles.text}>CookHubは、レシピの更新を記録したり、レシピを自分に合うようにアレンジ、より良いアレンジをもとのレシピに統合</Text>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>+ レシピを作る</Text>
      </Pressable>

      <TextInput style={styles.inputBox} />
      <View style={styles.rowBetween}>
        <Text style={styles.h2Text}>人気のレシピ</Text>
        <Text style={styles.text}>すべて見る</Text>
      </View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recipeContainer}>

        <View style={styles.recipe}>
          <Image style={styles.recipeImage} />
          <View style={styles.recipeExplain}>
            <Text style={styles.h3Text}>ヴォルデモート</Text>
          </View>
        </View>

        <View style={styles.recipe}>
          <Image style={styles.recipeImage} />
          <View style={styles.recipeExplain}>
            <Text style={styles.h3Text}>ヴォルデモート</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.rowBetween}>
        <Text style={styles.h2Text}>レシピの更新</Text>
        <Text style={styles.text}>すべて見る</Text>
      </View>

      <ScrollView style={styles.updateScrollView} contentContainerStyle={styles.recipeContainer}>

        <View style={styles.update}>
          <Text style={styles.text}>アントニオ猪木さんがアレンジしました</Text>
        </View>
        <View style={styles.update}>
          <Text style={styles.text}>アントニオ猪木さんがアレンジしました</Text>
        </View>
        <View style={styles.update}>
          <Text style={styles.text}>アントニオ猪木さんがアレンジしました</Text>
        </View>
        <View style={styles.update}>
          <Text style={styles.text}>アントニオ猪木さんがアレンジしました</Text>
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
  recipeContainer: {
    gap: 20,
  },
  updateScrollView: {
    maxHeight: 300
  },
  updateContainer: {
    gap: 20
  },
  h1Text: {
    fontSize: 40,
  },
  h2Text: {
    fontSize: 20,
  },
  h3Text: {
    fontSize: 17,
  },
  text: {
    fontSize: 15
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
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
    padding: 20,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#b1b1b1",
    backgroundColor: "#dbdbdb"
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
  recipeExplain: {
    width: 300,
    height: 150,
    padding: 20,
    backgroundColor: "#dbdbdb"
  },
  update: {
    height: 100,
    padding: 10,
    backgroundColor: "#dbdbdb"
  }
});

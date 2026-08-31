import { Text, TextInput, View, StyleSheet, ScrollView, Image } from "react-native";

export default function Search() {
  return (
    <View style={styles.screen}>
      <TextInput style={styles.inputBox} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={styles.recipe}>
          <Image style={styles.recipeImage} />
          <View style={styles.recipeExplain}>
            <Text>ヴォルデモート</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    gap: 20
  },
  scrollView: {
    flex: 1
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
    borderColor: "#b1b1b1",
    backgroundColor: "#dbdbdb"
  },
  recipe: {
    backgroundColor: "black",
    height: 350,
    overflow: "hidden",
    borderRadius: 20,
  },
  recipeImage: {
    height: 200,
  },
  recipeExplain: {
    flex: 1,
    padding: 20,
    backgroundColor: "#dbdbdb"
  }
});

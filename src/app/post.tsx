import { Text, View, StyleSheet } from "react-native";

export default function Post() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>投稿</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
  },
});

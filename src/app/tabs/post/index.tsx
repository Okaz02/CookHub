import { Text, View, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../../theme";

export default function PostList() {
  const router = useRouter();

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

        <Text style={styles.sectionLabel}>下書き</Text>

        <View style={styles.draftList}>
          <Pressable style={styles.draftCard} onPress={() => router.push("/tabs/post/write")}>
            <Image style={styles.draftThumbnail} />
            <View style={styles.draftInfo}>
              <Text style={styles.draftTitle}>我が家の絶品ふっくら煮込みハンバーグ</Text>
              <Text style={styles.draftMeta}>下書き保存: 5分前</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </Pressable>

          <Pressable style={styles.draftCard} onPress={() => router.push("/tabs/post/write")}>
            <Image style={styles.draftThumbnail} />
            <View style={styles.draftInfo}>
              <Text style={styles.draftTitle}>特製から揚げの甘辛ソース</Text>
              <Text style={styles.draftMeta}>下書き保存: 2日前</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </Pressable>

          <Pressable style={styles.draftCard} onPress={() => router.push("/tabs/post/write")}>
            <Image style={styles.draftThumbnail} />
            <View style={styles.draftInfo}>
              <Text style={styles.draftTitle}>簡単オムライス</Text>
              <Text style={styles.draftMeta}>下書き保存: 1週間前</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </Pressable>
        </View>
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

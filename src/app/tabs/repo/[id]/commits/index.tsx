import { useCallback, useState } from "react";
import { Text, View, Pressable, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../../../../theme";
import { useAuth } from "../../../../../context/AuthContext";
import { getRepoCommits, type Commit } from "../../../../../lib/api-repo";

export default function RepoCommits() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repoId = Number(id);
  const router = useRouter();
  const { token } = useAuth();

  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      getRepoCommits(repoId, token)
        .then((res) => {
          if (!cancelled) setCommits(res.data);
        })
        .catch(() => {
          if (!cancelled) setErrorMessage("更新履歴の取得に失敗しました。");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [repoId, token])
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.roastedBean} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "更新履歴" }} />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={commits}
        keyExtractor={(item) => item.sha}
        ListEmptyComponent={<Text style={styles.emptyText}>まだ更新履歴がありません。</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.commitRow}
            onPress={() => router.push(`/tabs/repo/${repoId}/commits/${item.sha}`)}
          >
            <MaterialIcons name="commit" size={18} color={colors.mutedForest} />
            <View style={styles.commitInfo}>
              <Text style={styles.commitMessage}>{item.message}</Text>
              <Text style={styles.commitMeta}>
                {item.author} ・ {new Date(item.date).toLocaleString("ja-JP")}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    padding: 12,
  },
  emptyText: {
    textAlign: "center",
    color: colors.onSurfaceVariant,
    padding: 24,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  commitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  commitInfo: {
    flex: 1,
    gap: 2,
  },
  commitMessage: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurface,
  },
  commitMeta: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
});

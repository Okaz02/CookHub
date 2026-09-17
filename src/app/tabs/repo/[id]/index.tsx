import { useCallback, useState } from "react";
import { Text, View, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../../../theme";
import { useAuth } from "../../../../context/AuthContext";
import { getRepo, forkRepo, type RepositoryDetail } from "../../../../lib/api-repo";
import { ApiError } from "../../../../lib/api";

export default function RepoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repoId = Number(id);
  const router = useRouter();
  const { token, account } = useAuth();

  const [repo, setRepo] = useState<RepositoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForking, setIsForking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      setErrorMessage("");

      getRepo(repoId, token)
        .then((res) => {
          if (!cancelled) setRepo(res.data);
        })
        .catch((error) => {
          if (cancelled) return;
          if (error instanceof ApiError && error.status === 403) {
            setErrorMessage("このレシピは非公開です。");
          } else if (error instanceof ApiError && error.status === 404) {
            setErrorMessage("レシピが見つかりませんでした。");
          } else {
            setErrorMessage("レシピの取得に失敗しました。");
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [repoId, token])
  );

  async function handleFork() {
    if (!token || !repo) {
      router.push("/login");
      return;
    }
    setIsForking(true);
    try {
      const res = await forkRepo(repo.id, {}, token);
      router.replace(`/tabs/repo/${res.data.id}`);
    } catch {
      setErrorMessage("フォークに失敗しました。");
    } finally {
      setIsForking(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.roastedBean} />
      </View>
    );
  }

  if (errorMessage || !repo) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage || "レシピの取得に失敗しました。"}</Text>
      </View>
    );
  }

  const isOwner = account?.id === repo.owner.user_id;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: repo.name }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {repo.thumbnail ? (
          <Image style={styles.thumbnail} source={{ uri: repo.thumbnail }} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
        )}

        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>{repo.name}</Text>
            <Text style={styles.subtitle}>{repo.owner.username}</Text>
          </View>
          {repo.private ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>非公開</Text>
            </View>
          ) : null}
          {repo.draft ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>下書き</Text>
            </View>
          ) : null}
        </View>

        {repo.fork ? (
          <View style={styles.forkNotice}>
            <MaterialIcons name="fork-right" size={16} color={colors.mutedForest} />
            <Text style={styles.forkNoticeText}>
              {repo.fork_type === 2 ? "移植" : "アレンジ"} ・元レシピ #{repo.parent_id}
            </Text>
          </View>
        ) : null}

        {repo.description ? <Text style={styles.description}>{repo.description}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push(`/tabs/repo/${repo.id}/commits`)}
          >
            <MaterialIcons name="history" size={16} color={colors.roastedBean} />
            <Text style={styles.actionButtonText}>更新履歴</Text>
          </Pressable>
          {isOwner ? (
            <Pressable
              style={styles.forkButton}
              onPress={() => router.push({ pathname: "/tabs/post/write", params: { id: String(repo.id) } })}
            >
              <MaterialIcons name="edit" size={16} color={colors.linenCream} />
              <Text style={styles.forkButtonText}>編集する</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.forkButton} onPress={handleFork} disabled={isForking}>
              {isForking ? (
                <ActivityIndicator size="small" color={colors.linenCream} />
              ) : (
                <>
                  <MaterialIcons name="fork-right" size={16} color={colors.linenCream} />
                  <Text style={styles.forkButtonText}>アレンジする</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {repo.environment.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>必須環境</Text>
            {repo.environment.map((item, index) => (
              <View key={index} style={styles.envRow}>
                <Text style={styles.envKey}>{item.key_name}</Text>
                <Text style={styles.envValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {repo.ingredients.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>材料</Text>
            {repo.ingredients.map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{item.name}</Text>
                <Text style={styles.ingredientAmount}>
                  {item.amount} {item.unit}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {repo.steps.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>作り方</Text>
            {repo.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                {step.image_url ? <Image style={styles.stepImage} source={{ uri: step.image_url }} /> : null}
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
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
    padding: 24,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.surfaceContainer,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.secondaryContainer,
  },
  badgeText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: "600",
  },
  forkNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  forkNoticeText: {
    fontSize: 12,
    color: colors.mutedForest,
  },
  description: {
    fontSize: 14,
    color: colors.onSurface,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  forkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.roastedBean,
  },
  forkButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linenCream,
  },
  section: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  envRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  envKey: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  envValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurface,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  ingredientName: {
    fontSize: 13,
    color: colors.onSurface,
  },
  ingredientAmount: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  stepRow: {
    gap: 8,
  },
  stepNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.roastedBean,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.linenCream,
  },
  stepImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },
  stepBody: {
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 20,
  },
});

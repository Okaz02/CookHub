import { useCallback, useState } from "react";
import { Text, View, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet, Alert, TextInput } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../../../theme";
import { useAuth } from "../../../../context/AuthContext";
import { getRepo, forkRepo, deleteRepo, getRepoStateNotice, type RepositoryDetail } from "../../../../lib/api-repo";
import { RepoStateBadges } from "../../../../components/RepoStateBadges";
import { createPullRequest, mergePullRequest } from "../../../../lib/api-pull-request";
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

  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposeTitle, setProposeTitle] = useState("");
  const [proposeContent, setProposeContent] = useState("");
  const [isProposing, setIsProposing] = useState(false);
  const [proposeResult, setProposeResult] = useState("");

  const [showMergeForm, setShowMergeForm] = useState(false);
  const [mergePrId, setMergePrId] = useState("");
  const [mergeCommitMessage, setMergeCommitMessage] = useState("");
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState("");

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
            setErrorMessage("このレシピは閲覧できません。下書き、または公開範囲が「自分のみ」に設定されています。");
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

  function handleDelete() {
    if (!token || !repo) return;
    Alert.alert("レシピを削除しますか？", "この操作は取り消せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRepo(repo.id, token);
            router.replace("/tabs/post");
          } catch {
            setErrorMessage("削除に失敗しました。");
          }
        },
      },
    ]);
  }

  async function handleFork() {
    if (!token || !repo) {
      router.push("/login");
      return;
    }
    setIsForking(true);
    try {
      const res = await forkRepo(repo.id, { title: repo.name + " (forked)" }, token);
      router.replace(`/tabs/repo/${res.data.id}`);
    } catch {
      setErrorMessage("フォークに失敗しました。");
    } finally {
      setIsForking(false);
    }
  }

  async function handlePropose() {
    if (!token || !repo || !proposeTitle.trim()) return;
    setIsProposing(true);
    setProposeResult("");
    try {
      const res = await createPullRequest(repo.id, { title: proposeTitle, content: proposeContent }, token);
      setProposeResult(`提案を送信しました（PR番号: ${res.data.id}）`);
      setProposeTitle("");
      setProposeContent("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setProposeResult("このレシピはフォークではないため提案できません。");
      } else {
        setProposeResult("提案の送信に失敗しました。");
      }
    } finally {
      setIsProposing(false);
    }
  }

  async function handleMerge() {
    if (!token || !mergePrId.trim()) return;
    setIsMerging(true);
    setMergeResult("");
    try {
      await mergePullRequest(Number(mergePrId), { commit_message: mergeCommitMessage || undefined }, token);
      setMergeResult("マージしました。");
      setMergePrId("");
      setMergeCommitMessage("");
      getRepo(repoId, token).then((res) => setRepo(res.data));
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setMergeResult("取り込み先のオーナーのみマージできます。");
      } else if (error instanceof ApiError && error.status === 409) {
        setMergeResult("このプルリクエストは既にマージ済みです。");
      } else if (error instanceof ApiError && error.status === 404) {
        setMergeResult("プルリクエストが見つかりませんでした。");
      } else {
        setMergeResult("マージに失敗しました。");
      }
    } finally {
      setIsMerging(false);
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
  const stateNotice = getRepoStateNotice(repo);

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
          <RepoStateBadges repo={repo} />
        </View>

        {isOwner && stateNotice ? (
          <View style={styles.stateNotice}>
            <MaterialIcons
              name={repo.draft ? "edit-note" : "lock"}
              size={16}
              color={colors.dustyRose}
            />
            <Text style={styles.stateNoticeText}>{stateNotice}</Text>
          </View>
        ) : null}

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
          {/* 編集できるかどうかの判定はバックエンドに任せ、フロントは編集画面へ遷移するだけにする。 */}
          <Pressable
            style={styles.forkButton}
            onPress={() => router.push({ pathname: "/tabs/post/write", params: { id: String(repo.id) } })}
          >
            <MaterialIcons name="edit" size={16} color={colors.linenCream} />
            <Text style={styles.forkButtonText}>編集する</Text>
          </Pressable>
          {isOwner ? (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <MaterialIcons name="delete-outline" size={16} color={colors.error} />
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

        {isOwner && repo.fork ? (
          <View style={styles.section}>
            <Pressable style={styles.sectionToggle} onPress={() => setShowProposeForm((v) => !v)}>
              <MaterialIcons name="call-merge" size={16} color={colors.mutedForest} />
              <Text style={styles.sectionTitle}>元レシピに変更を提案する</Text>
            </Pressable>
            {showProposeForm ? (
              <View style={styles.formCard}>
                <TextInput
                  style={styles.formInput}
                  value={proposeTitle}
                  onChangeText={setProposeTitle}
                  placeholder="提案のタイトル（必須）"
                />
                <TextInput
                  style={styles.formInput}
                  value={proposeContent}
                  onChangeText={setProposeContent}
                  placeholder="提案の説明（任意）"
                  multiline
                />
                <Pressable style={styles.formSubmitButton} onPress={handlePropose} disabled={isProposing}>
                  {isProposing ? (
                    <ActivityIndicator size="small" color={colors.linenCream} />
                  ) : (
                    <Text style={styles.formSubmitButtonText}>提案を送信</Text>
                  )}
                </Pressable>
                {proposeResult ? <Text style={styles.formResultText}>{proposeResult}</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {isOwner ? (
          <View style={styles.section}>
            <Pressable style={styles.sectionToggle} onPress={() => setShowMergeForm((v) => !v)}>
              <MaterialIcons name="call-merge" size={16} color={colors.mutedForest} />
              <Text style={styles.sectionTitle}>提案をマージする</Text>
            </Pressable>
            {showMergeForm ? (
              <View style={styles.formCard}>
                <TextInput
                  style={styles.formInput}
                  value={mergePrId}
                  onChangeText={setMergePrId}
                  placeholder="プルリクエスト番号"
                  keyboardType="number-pad"
                />
                <TextInput
                  style={styles.formInput}
                  value={mergeCommitMessage}
                  onChangeText={setMergeCommitMessage}
                  placeholder="コミットメッセージ（任意）"
                />
                <Pressable style={styles.formSubmitButton} onPress={handleMerge} disabled={isMerging}>
                  {isMerging ? (
                    <ActivityIndicator size="small" color={colors.linenCream} />
                  ) : (
                    <Text style={styles.formSubmitButtonText}>マージする</Text>
                  )}
                </Pressable>
                {mergeResult ? <Text style={styles.formResultText}>{mergeResult}</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}

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
  stateNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
  },
  stateNoticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.onSurfaceVariant,
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
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(186,26,26,0.4)",
    backgroundColor: colors.surfaceContainerLowest,
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
  sectionToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  formCard: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.onSurface,
  },
  formSubmitButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.roastedBean,
  },
  formSubmitButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linenCream,
  },
  formResultText: {
    fontSize: 12,
    color: colors.mutedForest,
    textAlign: "center",
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

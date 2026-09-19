import { useCallback, useState } from "react";
import { Text, View, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet, Switch } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../../theme";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/api";
import {
  createRepo,
  getRepo,
  updateRepo,
  type Environment,
  type Ingredient,
  type Step,
} from "../../../lib/api-repo";

const SERVING_PRESETS = ["1人分", "2人分", "3〜4人"];

type IngredientDraft = Ingredient & { key: string };
type StepDraft = Step & { key: string };

let draftKeySeed = 0;
function nextKey() {
  draftKeySeed += 1;
  return `draft-${draftKeySeed}`;
}

export default function Write() {
  const router = useRouter();
  const { id: repoIdParam } = useLocalSearchParams<{ id?: string }>();
  const editingRepoId = repoIdParam ? Number(repoIdParam) : null;
  const { token } = useAuth();

  const [isLoading, setIsLoading] = useState(Boolean(editingRepoId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [serving, setServing] = useState("2人分");
  const [commitMessage, setCommitMessage] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { key: nextKey(), name: "", amount: "", unit: "" },
  ]);
  const [steps, setSteps] = useState<StepDraft[]>([{ key: nextKey(), body: "", image_url: null }]);

  useFocusEffect(
    useCallback(() => {
      if (!editingRepoId) return;
      let cancelled = false;
      setIsLoading(true);
      getRepo(editingRepoId, token)
        .then((res) => {
          if (cancelled) return;
          const repo = res.data;
          setTitle(repo.name);
          setDescription(repo.description ?? "");
          setThumbnail(repo.thumbnail ?? "");
          setIsPrivate(repo.private);
          const servingEnv = repo.environment.find((env) => env.key_name === "人数");
          if (servingEnv) setServing(servingEnv.value);
          setIngredients(
            repo.ingredients.length > 0
              ? repo.ingredients.map((item) => ({ ...item, key: nextKey() }))
              : [{ key: nextKey(), name: "", amount: "", unit: "" }]
          );
          setSteps(
            repo.steps.length > 0
              ? repo.steps.map((item) => ({ ...item, key: nextKey() }))
              : [{ key: nextKey(), body: "", image_url: null }]
          );
        })
        .catch(() => {
          if (!cancelled) setErrorMessage("レシピの読み込みに失敗しました。");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [editingRepoId, token])
  );

  function updateIngredient(key: string, patch: Partial<Ingredient>) {
    setIngredients((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeIngredient(key: string) {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  function updateStep(key: string, patch: Partial<Step>) {
    setSteps((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeStep(key: string) {
    setSteps((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  async function handleSubmit(isDraft: boolean) {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("レシピのタイトルを入力してください。");
      return;
    }

    // 「公開する」は文言どおり必ず公開にする。公開範囲スイッチが効くのは下書き保存のときだけ。
    const willBePrivate = isDraft ? isPrivate : false;

    const environment: Environment[] = [{ key_name: "人数", value: serving }];
    const cleanedIngredients = ingredients
      .filter((item) => item.name.trim())
      .map(({ name, amount, unit }) => ({ name, amount, unit }));
    const cleanedSteps = steps
      .filter((item) => item.body.trim())
      .map(({ body, image_url }) => ({ body, image_url: image_url || null }));

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const input = {
        title,
        description,
        thumbnail: thumbnail || null,
        is_private: willBePrivate,
        is_draft: isDraft,
        environment,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
        commit_message: commitMessage || undefined,
      };

      const res = editingRepoId
        ? await updateRepo(editingRepoId, input, token)
        : await createRepo(input, token);

      router.replace(`/tabs/repo/${res.data.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrorMessage("同じ名前のレシピを既に持っています。");
      } else {
        setErrorMessage("保存に失敗しました。");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.roastedBean} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.discardButton} onPress={() => router.back()}>
          <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
          <Text style={styles.discardText}>破棄</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{editingRepoId ? "レシピを編集" : "レシピを書く"}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            サムネイル画像URL
          </Text>
          <TextInput
            style={styles.titleInput}
            value={thumbnail}
            onChangeText={setThumbnail}
            placeholder="https://example.com/photo.png"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            レシピのタイトル <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="例: 我が家の絶品ふっくら煮込みハンバーグ"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>説明</Text>
          <TextInput
            style={styles.catchphraseInput}
            multiline
            numberOfLines={2}
            value={description}
            onChangeText={setDescription}
            placeholder="このレシピの説明やこだわりを書きましょう"
          />
        </View>

        <View style={styles.presetsCard}>
          <View style={styles.presetsHeaderRow}>
            <View style={styles.presetsHeaderLeft}>
              <MaterialIcons name="restaurant" size={16} color={colors.mutedForest} />
              <Text style={styles.presetsHeaderLabel}>分量</Text>
            </View>
            <Text style={styles.presetsHeaderValue}>現在: {serving}</Text>
          </View>
          <View style={styles.servingPillRow}>
            {SERVING_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                style={[styles.servingPill, serving === preset && styles.servingPillActive]}
                onPress={() => setServing(preset)}
              >
                <Text style={serving === preset ? styles.servingPillActiveText : styles.servingPillText}>
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.titleInput}
            value={SERVING_PRESETS.includes(serving) ? "" : serving}
            onChangeText={setServing}
            placeholder="自由入力（例: 4〜6人分）"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>材料</Text>
          </View>

          <View style={styles.ingredientList}>
            {ingredients.map((item) => (
              <View key={item.key} style={styles.ingredientRow}>
                <TextInput
                  style={styles.ingredientNameInput}
                  value={item.name}
                  onChangeText={(text) => updateIngredient(item.key, { name: text })}
                  placeholder="材料名（例: 玉ねぎ）"
                />
                <TextInput
                  style={styles.ingredientAmountInput}
                  value={String(item.amount)}
                  onChangeText={(text) => updateIngredient(item.key, { amount: text })}
                  placeholder="分量"
                />
                <TextInput
                  style={styles.ingredientUnitInput}
                  value={item.unit}
                  onChangeText={(text) => updateIngredient(item.key, { unit: text })}
                  placeholder="単位"
                />
                <Pressable style={styles.ingredientDeleteButton} onPress={() => removeIngredient(item.key)}>
                  <MaterialIcons name="close" size={18} color={colors.outlineVariant} />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.dashedAddButton}
            onPress={() => setIngredients((prev) => [...prev, { key: nextKey(), name: "", amount: "", unit: "" }])}
          >
            <MaterialIcons name="add" size={18} color={colors.roastedBean} />
            <Text style={styles.dashedAddButtonText}>材料を追加する</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>作り方・手順</Text>
          </View>

          <View style={styles.stepList}>
            {steps.map((step, stepIndex) => (
              <View key={step.key} style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View style={styles.stepHeaderLeft}>
                    <View style={styles.stepNumberCircle}>
                      <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => removeStep(step.key)}>
                    <MaterialIcons name="delete" size={18} color={colors.outline} />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.stepTextArea}
                  multiline
                  numberOfLines={3}
                  value={step.body}
                  onChangeText={(text) => updateStep(step.key, { body: text })}
                  placeholder="手順を入力"
                />
                <TextInput
                  style={styles.titleInput}
                  value={step.image_url ?? ""}
                  onChangeText={(text) => updateStep(step.key, { image_url: text || null })}
                  placeholder="画像URL（任意）"
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>

          <Pressable
            style={styles.dashedAddButton}
            onPress={() => setSteps((prev) => [...prev, { key: nextKey(), body: "", image_url: null }])}
          >
            <MaterialIcons name="add" size={18} color={colors.roastedBean} />
            <Text style={styles.dashedAddButtonText}>手順を追加する</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>更新メモ（コミットメッセージ）</Text>
          <TextInput
            style={styles.titleInput}
            value={commitMessage}
            onChangeText={setCommitMessage}
            placeholder={editingRepoId ? "例: 材料の分量を調整" : `例: レシピ作成: ${title || "..."}`}
          />
        </View>

        <View style={styles.visibilityRow}>
          <View style={styles.visibilityRowLeft}>
            <MaterialIcons name="public" size={20} color={colors.mutedForest} />
            <View>
              <Text style={styles.visibilityTitle}>公開範囲</Text>
              <Text style={styles.visibilitySubtitle}>
                {isPrivate ? "非公開（自分のみ閲覧可能）" : "全体に公開（CookHubタイムライン）"}
              </Text>
              {isPrivate ? (
                <Text style={styles.visibilityHint}>「公開する」を押すと全体に公開されます。</Text>
              ) : null}
            </View>
          </View>
          <Switch value={!isPrivate} onValueChange={(value) => setIsPrivate(!value)} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarRow}>
          <Pressable
            style={styles.draftSaveButton}
            onPress={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            <MaterialIcons name="bookmark-border" size={18} color={colors.roastedBean} />
            <Text style={styles.draftSaveButtonText}>下書き保存</Text>
          </Pressable>
          <Pressable
            style={styles.publishButton}
            onPress={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.linenCream} />
            ) : (
              <>
                <MaterialIcons name="publish" size={18} color={colors.linenCream} />
                <Text style={styles.publishButtonText}>公開する</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  discardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  discardText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
  },
  headerCenter: {
    alignItems: "center",
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
    gap: 24,
  },
  field: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
    marginBottom: 4,
  },
  required: {
    color: colors.error,
  },
  titleInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(62,39,35,0.2)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
  },
  catchphraseInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(62,39,35,0.2)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
    textAlignVertical: "top",
  },
  presetsCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    gap: 12,
  },
  presetsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  presetsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  presetsHeaderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  presetsHeaderValue: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  servingPillRow: {
    flexDirection: "row",
    gap: 6,
  },
  servingPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
  },
  servingPillText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  servingPillActive: {
    borderColor: colors.roastedBean,
    backgroundColor: colors.roastedBean,
  },
  servingPillActiveText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.linenCream,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  ingredientList: {
    gap: 8,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  ingredientNameInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    padding: 4,
  },
  ingredientAmountInput: {
    width: 60,
    fontSize: 12,
    textAlign: "right",
    color: colors.onSurface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ingredientUnitInput: {
    width: 50,
    fontSize: 12,
    color: colors.onSurface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ingredientDeleteButton: {
    padding: 4,
  },
  dashedAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(62,39,35,0.3)",
    backgroundColor: colors.surfaceContainerLow,
  },
  dashedAddButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  stepList: {
    gap: 12,
  },
  stepCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    gap: 8,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.roastedBean,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linenCream,
  },
  stepTextArea: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: colors.onSurface,
    textAlignVertical: "top",
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
  },
  visibilityRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  visibilityTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  visibilityHint: {
    fontSize: 11,
    color: colors.error,
  },
  visibilitySubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomBarRow: {
    flexDirection: "row",
    gap: 10,
  },
  draftSaveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(62,39,35,0.3)",
    backgroundColor: colors.surfaceContainerLow,
  },
  draftSaveButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  publishButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.roastedBean,
  },
  publishButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linenCream,
  },
});

import { useCallback, useState } from "react";
import { Text, View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect, useLocalSearchParams, Stack } from "expo-router";
import { colors } from "../../../../../theme";
import { useAuth } from "../../../../../context/AuthContext";
import {
  formatCommitDate,
  getCommitAuthorName,
  getRecipeCommit,
  type CommitDetail,
  type DiffRow,
} from "../../../../../lib/api-recipe";

const DIFF_LABEL: Record<DiffRow["diff_type"], string> = {
  added: "追加",
  modified: "変更",
  removed: "削除",
};

const SECTION_LABEL: Record<string, string> = {
  info: "レシピ情報",
  environment: "必須環境",
  ingredients: "材料",
  steps: "手順",
};

const FIELD_LABEL: Record<string, string> = {
  sort_order: "順番",
  key_name: "項目",
  value: "内容",
  name: "材料名",
  amount: "分量",
  unit: "単位",
  body: "手順",
  image_url: "画像URL",
  title: "タイトル",
  description: "説明",
  thumbnail: "サムネイル",
};

// 並び順は 0 始まりで返ってくるが、画面では 1 番目から数える。
function formatValue(field: string, value: unknown) {
  if (value === null || value === undefined) return "";
  if (field === "sort_order" && typeof value === "number") return String(value + 1);
  return String(value);
}

function DiffRowView({ row }: { row: DiffRow }) {
  const fields = Object.keys(row)
    .filter((key) => key.startsWith("to_"))
    .map((key) => key.slice(3))
    .filter((field) => {
      const from = formatValue(field, row[`from_${field}`]);
      const to = formatValue(field, row[`to_${field}`]);
      if (row.diff_type === "modified") return from !== to;
      return (row.diff_type === "removed" ? from : to) !== "";
    });

  return (
    <View style={styles.diffRow}>
      <View style={[styles.diffBadge, styles[`diffBadge_${row.diff_type}` as const]]}>
        <Text style={styles.diffBadgeText}>{DIFF_LABEL[row.diff_type]}</Text>
      </View>
      <View style={styles.diffFields}>
        {fields.map((field) => {
          const from = formatValue(field, row[`from_${field}`]);
          const to = formatValue(field, row[`to_${field}`]);
          return (
            <View key={field} style={styles.diffField}>
              <Text style={styles.diffFieldLabel}>{FIELD_LABEL[field] ?? field}</Text>
              {row.diff_type === "modified" ? (
                <Text style={styles.diffFieldValue}>
                  <Text style={styles.diffFrom}>{from}</Text> {"→"} <Text style={styles.diffTo}>{to}</Text>
                </Text>
              ) : (
                <Text style={styles.diffFieldValue}>{row.diff_type === "removed" ? from : to}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function CommitDetailScreen() {
  const { id, commitId } = useLocalSearchParams<{ id: string; commitId: string }>();
  const recipeId = Number(id);
  const { token } = useAuth();

  const [commit, setCommit] = useState<CommitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      getRecipeCommit(recipeId, commitId, token)
        .then((res) => {
          if (!cancelled) setCommit(res.data);
        })
        .catch(() => {
          if (!cancelled) setErrorMessage("更新内容の取得に失敗しました。");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [recipeId, commitId, token])
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.roastedBean} />
      </View>
    );
  }

  if (errorMessage || !commit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage || "更新内容が見つかりませんでした。"}</Text>
      </View>
    );
  }

  const sections = (Object.keys(SECTION_LABEL) as (keyof CommitDetail["changes"])[])
    .map((key) => ({ key, label: SECTION_LABEL[key], rows: commit.changes[key] ?? [] }))
    .filter((section) => section.rows.length > 0);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "更新内容" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.message}>{commit.message}</Text>
        <Text style={styles.meta}>
          {getCommitAuthorName(commit.author)} ・ {formatCommitDate(commit.date)}
        </Text>

        {sections.length === 0 ? (
          <Text style={styles.emptyText}>この更新には変更内容がありません。</Text>
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.label}</Text>
              {section.rows.map((row, index) => (
                <DiffRowView key={index} row={row} />
              ))}
            </View>
          ))
        )}
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
  emptyText: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingTop: 24,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  meta: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
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
  diffRow: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  diffBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
  },
  diffBadge_added: {
    backgroundColor: colors.secondaryContainer,
  },
  diffBadge_modified: {
    backgroundColor: "rgba(166,123,115,0.25)",
  },
  diffBadge_removed: {
    backgroundColor: "rgba(186,26,26,0.15)",
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  diffFields: {
    flex: 1,
    gap: 4,
  },
  diffField: {
    gap: 2,
  },
  diffFieldLabel: {
    fontSize: 10,
    color: colors.outline,
  },
  diffFieldValue: {
    fontSize: 12,
    color: colors.onSurface,
  },
  diffFrom: {
    color: colors.error,
    textDecorationLine: "line-through",
  },
  diffTo: {
    color: colors.mutedForest,
    fontWeight: "600",
  },
});

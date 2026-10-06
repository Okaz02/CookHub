import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../theme";
import type { Step } from "../../lib/api-recipe";

// 操作するたびに裏で生成されるレシピを、画面下でいつでも確認できるようにする。
export function RecipePreview({ steps }: { steps: Step[] }) {
  const [expanded, setExpanded] = useState(false);
  const latest = steps[steps.length - 1];
  return (
    <View style={styles.panel}>
      <Pressable style={styles.header} onPress={() => setExpanded((prev) => !prev)}>
        <MaterialIcons name="auto-awesome" size={16} color={colors.mutedForest} />
        <Text style={styles.title}>自動生成レシピ（{steps.length}手順）</Text>
        <MaterialIcons name={expanded ? "expand-more" : "expand-less"} size={20} color={colors.outline} />
      </Pressable>
      {expanded ? (
        <ScrollView style={styles.list} contentContainerStyle={{ gap: 8 }}>
          {steps.length === 0 ? <Text style={styles.empty}>調理するとここに手順が書き出されます。</Text> : null}
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.number}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step.body}</Text>
            </View>
          ))}
        </ScrollView>
      ) : latest ? (
        <Text style={styles.latest} numberOfLines={1}>
          {steps.length}. {latest.body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  list: {
    maxHeight: 220,
  },
  empty: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  stepRow: {
    flexDirection: "row",
    gap: 8,
  },
  number: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.roastedBean,
  },
  numberText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.linenCream,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurface,
  },
  latest: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
});

import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { getRecipeStateBadges, type Recipe, type RecipeStateTone } from "../lib/api-recipe";

type Props = {
  recipe: Pick<Recipe, "draft" | "private" | "fork" | "fork_type">;
  showFork?: boolean;
};

// 下書きかどうか（状態）と公開範囲（誰が見られるか）を、常に別々のバッジとして並べる。
export function RecipeStateBadges({ recipe, showFork = false }: Props) {
  return (
    <View style={styles.row}>
      {getRecipeStateBadges(recipe).map((badge) => (
        <View key={badge.key} style={[styles.badge, toneStyles[badge.tone]]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      ))}
      {showFork && recipe.fork ? (
        <View style={[styles.badge, toneStyles.neutral]}>
          <Text style={styles.badgeText}>{recipe.fork_type === 2 ? "移植" : "アレンジ"}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
});

const toneStyles: Record<RecipeStateTone | "neutral", { backgroundColor: string; borderColor: string }> = {
  draft: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.dustyRose,
  },
  private: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.outline,
  },
  public: {
    backgroundColor: colors.secondaryContainer,
    borderColor: colors.secondaryContainer,
  },
  neutral: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.surfaceContainerHigh,
  },
};

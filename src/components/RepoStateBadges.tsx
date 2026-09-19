import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { getRepoStateBadges, type Repository, type RepoStateTone } from "../lib/api-repo";

type Props = {
  repo: Pick<Repository, "draft" | "private" | "fork" | "fork_type">;
  showFork?: boolean;
};

// 下書きかどうか（状態）と公開範囲（誰が見られるか）を、常に別々のバッジとして並べる。
export function RepoStateBadges({ repo, showFork = false }: Props) {
  return (
    <View style={styles.row}>
      {getRepoStateBadges(repo).map((badge) => (
        <View key={badge.key} style={[styles.badge, toneStyles[badge.tone]]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      ))}
      {showFork && repo.fork ? (
        <View style={[styles.badge, toneStyles.neutral]}>
          <Text style={styles.badgeText}>{repo.fork_type === 2 ? "移植" : "アレンジ"}</Text>
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

const toneStyles: Record<RepoStateTone | "neutral", { backgroundColor: string; borderColor: string }> = {
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

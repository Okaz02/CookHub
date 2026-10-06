import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../theme";
import { getHeatLevel } from "../../lib/kitchen/constants";
import { ingredientsInTool, type KitchenSnapshot } from "../../lib/kitchen/reducer";
import { getCutLabel, getIngredientHistory } from "../../lib/kitchen/recipeGenerator";
import { BottomSheet, PrimaryButton, SectionLabel, sheetStyles } from "./BottomSheet";
import { IngredientArt } from "./IngredientSprite";

export type FocusTarget = { kind: "ingredient"; id: string } | { kind: "tool"; id: string };

type Props = {
  snapshot: KitchenSnapshot;
  target: FocusTarget;
  onClose: () => void;
  onFocus: (target: FocusTarget) => void;
  onToolAction: (toolId: string) => void;
};

function locationLabel(snapshot: KitchenSnapshot, ingredientId: string) {
  const ingredient = snapshot.ingredients.find((item) => item.id === ingredientId);
  if (!ingredient) return "";
  switch (ingredient.location.area) {
    case "shelf":
      return "棚";
    case "board":
      return "まな板の上";
    case "tool": {
      const toolId = ingredient.location.toolId;
      return `${snapshot.tools.find((tool) => tool.id === toolId)?.name ?? "器具"}の中`;
    }
  }
}

export function FocusSheet({ snapshot, target, onClose, onFocus, onToolAction }: Props) {
  if (target.kind === "ingredient") {
    const ingredient = snapshot.ingredients.find((item) => item.id === target.id);
    if (!ingredient) return null;
    const history = getIngredientHistory(snapshot, ingredient.id);
    return (
      <BottomSheet visible title={ingredient.name} subtitle={[`${ingredient.amount}${ingredient.unit}`, `いま: ${locationLabel(snapshot, ingredient.id)}`].filter(Boolean).join("・")} onClose={onClose}>
        <View style={styles.summaryRow}>
          <IngredientArt image={ingredient.image} name={ingredient.name} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.summaryText}>切り方: {ingredient.cut ? getCutLabel(ingredient.cut) : "まだ切っていない"}</Text>
            <Text style={styles.summaryText}>操作した回数: {history.length}回</Text>
          </View>
        </View>
        <SectionLabel>この材料にしたこと</SectionLabel>
        {history.length === 0 ? (
          <Text style={sheetStyles.hint}>まだ何もしていません。棚からまな板や器具へドラッグしてみましょう。</Text>
        ) : (
          <View style={styles.timeline}>
            {history.map((entry, index) => (
              <View key={entry.id} style={styles.timelineRow}>
                <View style={styles.timelineDot}>
                  <MaterialIcons name={entry.icon as never} size={14} color={colors.linenCream} />
                </View>
                <Text style={styles.timelineText}>
                  {index + 1}. {entry.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </BottomSheet>
    );
  }

  const tool = snapshot.tools.find((item) => item.id === target.id);
  if (!tool) return null;
  const contents = ingredientsInTool(snapshot, tool.id);
  const status = [
    tool.waterMl > 0 ? `水 ${tool.waterMl}ml` : null,
    tool.heat ? `${getHeatLevel(tool.heat.level).label}で加熱中` : null,
    tool.boiling ? "沸騰中" : null,
  ]
    .filter(Boolean)
    .join("・");
  return (
    <BottomSheet visible title={tool.name} subtitle={status || "空の状態です"} onClose={onClose}>
      {tool.definition ? (
        <Text style={sheetStyles.hint}>できること: {tool.definition.actions.join("、")}</Text>
      ) : null}
      <SectionLabel>中に入っているもの（タップで詳細）</SectionLabel>
      {contents.length === 0 ? (
        <Text style={sheetStyles.hint}>まだ何も入っていません。</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {contents.map((item) => (
            <Pressable key={item.id} style={styles.contentRow} onPress={() => onFocus({ kind: "ingredient", id: item.id })}>
              <IngredientArt image={item.image} name={item.name} size={36} />
              <Text style={styles.summaryText}>
                {item.name}
                {item.cut ? `（${getCutLabel(item.cut)}）` : ""}
              </Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.outline} style={{ marginLeft: "auto" }} />
            </Pressable>
          ))}
        </View>
      )}
      {tool.kind === "custom" && tool.definition?.container ? (
        <PrimaryButton label="中身に対して動作する" onPress={() => onToolAction(tool.id)} disabled={contents.length === 0} />
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
  },
  summaryText: {
    fontSize: 13,
    color: colors.onSurface,
  },
  timeline: {
    gap: 10,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mutedForest,
  },
  timelineText: {
    flex: 1,
    fontSize: 13,
    color: colors.onSurface,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
});

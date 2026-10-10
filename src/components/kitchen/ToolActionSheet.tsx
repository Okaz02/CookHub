import { useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { ACTION_COUNT_PRESETS, COUNTED_ACTIONS } from "../../lib/kitchen/constants";
import { handActionsOf, isContainer } from "../../lib/kitchen/reducer";
import type { KitchenTool } from "../../lib/kitchen/types";
import { BottomSheet, Chip, ChipRow, NumberChoice, PrimaryButton, SectionLabel, sheetStyles } from "./BottomSheet";

export type ToolActionChoice = {
  action: string | null;
  putInside: boolean;
  // 「たたく」など回数を選べる動作の回数
  count?: number;
};

// 火を使わない動作（混ぜる・巻くなど）を選ぶ。火を使う動作はコンロの加熱シートで選ぶ

type Props = {
  visible: boolean;
  tool: KitchenTool | null;
  // 外から材料を持ってきた場合はその名前。器具の中身に対して実行する場合は null。
  ingredientName: string | null;
  onClose: () => void;
  onSelect: (choice: ToolActionChoice) => void;
};

export function ToolActionSheet({ visible, tool, ingredientName, onClose, onSelect }: Props) {
  const actions = tool ? handActionsOf(tool) : [];
  const [action, setAction] = useState<string | null>(actions[0] ?? "__custom");
  const [customAction, setCustomAction] = useState("");
  const [putInside, setPutInside] = useState(true);
  const [count, setCount] = useState<number | null>(10);

  if (!tool) return null;
  const container = isContainer(tool);
  const chosenAction = action === "__custom" ? customAction.trim() : action;
  const counted = chosenAction ? COUNTED_ACTIONS.includes(chosenAction) : false;

  return (
    <BottomSheet
      visible={visible}
      title={`${tool.name}で何をする？`}
      subtitle={ingredientName ? `対象: ${ingredientName}` : "器具の中身に対して行います"}
      onClose={onClose}
    >
      <SectionLabel>動作</SectionLabel>
      <ChipRow>
        {actions.map((item) => (
          <Chip key={item} label={item} active={action === item} onPress={() => setAction(item)} />
        ))}
        <Chip label="ほかの動作" active={action === "__custom"} onPress={() => setAction("__custom")} />
      </ChipRow>
      {action === "__custom" ? (
        <TextInput
          style={sheetStyles.textInput}
          value={customAction}
          onChangeText={setCustomAction}
          placeholder="例: 押しつぶす（「〜する」の形で）"
          autoFocus
        />
      ) : null}

      {counted ? (
        <>
          <SectionLabel>回数</SectionLabel>
          <NumberChoice presets={ACTION_COUNT_PRESETS} value={count} unit="回" onChange={setCount} />
        </>
      ) : null}

      {container && ingredientName ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={sheetStyles.hint}>{tool.name}の中に入れて行う</Text>
          <Switch value={putInside} onValueChange={setPutInside} />
        </View>
      ) : null}

      <View style={sheetStyles.buttonRow}>
        {container && ingredientName ? (
          <PrimaryButton
            label="入れるだけ"
            tone="secondary"
            onPress={() => onSelect({ action: null, putInside: true })}
          />
        ) : (
          <PrimaryButton label="やめる" tone="secondary" onPress={onClose} />
        )}
        <PrimaryButton
          label="実行"
          disabled={!chosenAction || (counted && !count)}
          onPress={() =>
            chosenAction &&
            onSelect({
              action: chosenAction,
              putInside: container && putInside,
              count: counted ? (count ?? undefined) : undefined,
            })
          }
        />
      </View>
    </BottomSheet>
  );
}

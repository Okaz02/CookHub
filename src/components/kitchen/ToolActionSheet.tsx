import { useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { HEAT_LEVELS, HEAT_MINUTE_PRESETS } from "../../lib/kitchen/constants";
import { isContainer } from "../../lib/kitchen/reducer";
import type { HeatLevel, KitchenTool } from "../../lib/kitchen/types";
import { BottomSheet, Chip, ChipRow, NumberChoice, PrimaryButton, SectionLabel, sheetStyles } from "./BottomSheet";

export type ToolActionChoice = {
  action: string | null;
  putInside: boolean;
  level?: HeatLevel;
  minutes?: number;
};

type Props = {
  visible: boolean;
  tool: KitchenTool | null;
  // 外から材料を持ってきた場合はその名前。器具の中身に対して実行する場合は null。
  ingredientName: string | null;
  onClose: () => void;
  onSelect: (choice: ToolActionChoice) => void;
};

export function ToolActionSheet({ visible, tool, ingredientName, onClose, onSelect }: Props) {
  const definition = tool?.definition;
  const [action, setAction] = useState<string | null>(definition?.actions[0] ?? null);
  const [customAction, setCustomAction] = useState("");
  const [putInside, setPutInside] = useState(true);
  const [useHeat, setUseHeat] = useState(false);
  const [level, setLevel] = useState<HeatLevel>("medium");
  const [minutes, setMinutes] = useState<number | null>(3);

  if (!tool) return null;
  const container = isContainer(tool);
  const onBurner = tool.location.area === "burner";
  const chosenAction = action === "__custom" ? customAction.trim() : action;

  return (
    <BottomSheet
      visible={visible}
      title={`${tool.name}で何をする？`}
      subtitle={ingredientName ? `対象: ${ingredientName}` : "器具の中身に対して行います"}
      onClose={onClose}
    >
      <SectionLabel>動作</SectionLabel>
      <ChipRow>
        {(definition?.actions ?? []).map((item) => (
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

      {container && ingredientName ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={sheetStyles.hint}>{tool.name}の中に入れて行う</Text>
          <Switch value={putInside} onValueChange={setPutInside} />
        </View>
      ) : null}

      {onBurner ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={sheetStyles.hint}>火加減と時間を指定する</Text>
            <Switch value={useHeat} onValueChange={setUseHeat} />
          </View>
          {useHeat ? (
            <>
              <ChipRow>
                {HEAT_LEVELS.map((item) => (
                  <Chip key={item.id} label={item.label} active={level === item.id} onPress={() => setLevel(item.id)} />
                ))}
              </ChipRow>
              <NumberChoice presets={HEAT_MINUTE_PRESETS} value={minutes} unit="分" onChange={setMinutes} />
            </>
          ) : null}
        </>
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
          disabled={!chosenAction || (useHeat && onBurner && !minutes)}
          onPress={() =>
            chosenAction &&
            onSelect({
              action: chosenAction,
              putInside: container && putInside,
              level: useHeat && onBurner ? level : undefined,
              minutes: useHeat && onBurner ? (minutes ?? undefined) : undefined,
            })
          }
        />
      </View>
    </BottomSheet>
  );
}

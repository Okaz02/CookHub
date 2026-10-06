import { useState } from "react";
import { Text, View } from "react-native";
import { HEAT_LEVELS, HEAT_MINUTE_PRESETS } from "../../lib/kitchen/constants";
import type { HeatLevel, KitchenTool } from "../../lib/kitchen/types";
import { BottomSheet, Chip, ChipRow, NumberChoice, PrimaryButton, SectionLabel, sheetStyles } from "./BottomSheet";

type Props = {
  visible: boolean;
  tool: KitchenTool | null;
  onClose: () => void;
  onHeat: (level: HeatLevel, minutes: number) => void;
  onTurnOff: () => void;
};

export function HeatSheet({ visible, tool, onClose, onHeat, onTurnOff }: Props) {
  const [level, setLevel] = useState<HeatLevel>(tool?.heat?.level ?? "medium");
  const [minutes, setMinutes] = useState<number | null>(tool?.heat?.minutes ?? 5);

  const hint = !tool
    ? ""
    : tool.waterMl > 0
      ? tool.boiling
        ? "沸騰しています。材料を入れてから加熱すると「煮る」になります。"
        : "水が入っています。加熱すると沸騰します。"
      : "水が入っていません。そのまま加熱します。";

  return (
    <BottomSheet visible={visible} title={`${tool?.name ?? ""}を加熱する`} subtitle={hint} onClose={onClose}>
      <SectionLabel>火加減</SectionLabel>
      <ChipRow>
        {HEAT_LEVELS.map((item) => (
          <Chip key={item.id} label={item.label} active={level === item.id} onPress={() => setLevel(item.id)} />
        ))}
      </ChipRow>

      <SectionLabel>時間</SectionLabel>
      <NumberChoice presets={HEAT_MINUTE_PRESETS} value={minutes} unit="分" onChange={setMinutes} />

      <Text style={sheetStyles.hint}>画面上では早送りで加熱します。</Text>

      <View style={sheetStyles.buttonRow}>
        {tool?.heat ? <PrimaryButton label="火を止める" tone="danger" onPress={onTurnOff} /> : null}
        <PrimaryButton
          label={tool?.heat ? "この火加減で続ける" : "火をつける"}
          disabled={!minutes}
          onPress={() => minutes && onHeat(level, minutes)}
        />
      </View>
    </BottomSheet>
  );
}

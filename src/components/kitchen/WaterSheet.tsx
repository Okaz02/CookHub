import { useState } from "react";
import { View } from "react-native";
import { WATER_PRESETS_ML } from "../../lib/kitchen/constants";
import { BottomSheet, NumberChoice, PrimaryButton, SectionLabel, sheetStyles } from "./BottomSheet";

type Props = {
  visible: boolean;
  toolName: string;
  onClose: () => void;
  onSelect: (ml: number) => void;
};

export function WaterSheet({ visible, toolName, onClose, onSelect }: Props) {
  const [ml, setMl] = useState<number | null>(1000);
  return (
    <BottomSheet visible={visible} title={`${toolName}に水を入れる`} onClose={onClose}>
      <SectionLabel>水の量</SectionLabel>
      <NumberChoice
        presets={WATER_PRESETS_ML}
        value={ml}
        unit="ml"
        onChange={setMl}
        formatPreset={(value) => (value >= 1000 ? `${value / 1000}L` : `${value}ml`)}
      />
      <View style={sheetStyles.buttonRow}>
        <PrimaryButton label="やめる" tone="secondary" onPress={onClose} />
        <PrimaryButton label="水を入れる" disabled={!ml} onPress={() => ml && onSelect(ml)} />
      </View>
    </BottomSheet>
  );
}

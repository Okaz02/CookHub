import { useState } from "react";
import { View } from "react-native";
import { CUT_STYLES, WIDTH_CUT_PRESETS_CM } from "../../lib/kitchen/constants";
import type { CutResult, CutStyleId } from "../../lib/kitchen/types";
import { BottomSheet, Chip, ChipRow, NumberChoice, PrimaryButton, SectionLabel, sheetStyles } from "./BottomSheet";

type Props = {
  visible: boolean;
  ingredientName: string;
  onClose: () => void;
  onSelect: (cut: CutResult) => void;
};

export function CutSheet({ visible, ingredientName, onClose, onSelect }: Props) {
  const [style, setStyle] = useState<CutStyleId | null>(null);
  const [widthCm, setWidthCm] = useState<number | null>(1);

  const canSubmit = style !== null && (style !== "width" || widthCm !== null);

  return (
    <BottomSheet visible={visible} title={`${ingredientName}をどう切る？`} subtitle="切り方を選ぶと包丁で切り始めます" onClose={onClose}>
      <SectionLabel>切り方</SectionLabel>
      <ChipRow>
        {CUT_STYLES.map((item) => (
          <Chip key={item.id} label={item.label} active={style === item.id} onPress={() => setStyle(item.id)} />
        ))}
        <Chip label="「 」cmずつ切る" active={style === "width"} onPress={() => setStyle("width")} />
      </ChipRow>

      {style === "width" ? (
        <View style={{ gap: 6 }}>
          <SectionLabel>幅</SectionLabel>
          <NumberChoice presets={WIDTH_CUT_PRESETS_CM} value={widthCm} unit="cm" onChange={setWidthCm} />
        </View>
      ) : null}

      <View style={sheetStyles.buttonRow}>
        <PrimaryButton label="やめる" tone="secondary" onPress={onClose} />
        <PrimaryButton
          label="切る"
          disabled={!canSubmit}
          onPress={() => {
            if (!style) return;
            onSelect(style === "width" ? { style, widthCm: widthCm ?? 1 } : { style });
            setStyle(null);
          }}
        />
      </View>
    </BottomSheet>
  );
}

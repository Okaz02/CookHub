import { useState } from "react";
import { View } from "react-native";
import { BottomSheet, Chip, ChipRow, PrimaryButton, SectionLabel, sheetStyles } from "./BottomSheet";

type Props = {
  visible: boolean;
  // 重ねた材料（塩など）と、重ねられた材料（肉など）
  ingredientName: string;
  targetName: string;
  actions: string[];
  onClose: () => void;
  onSelect: (action: string) => void;
};

// 材料を別の材料に重ねたとき、何をするかを選ぶ（肉に塩を「振る」など）
export function ApplySheet({ visible, ingredientName, targetName, actions, onClose, onSelect }: Props) {
  const [action, setAction] = useState<string | null>(actions[0] ?? null);
  return (
    <BottomSheet visible={visible} title={`${targetName}に${ingredientName}をどうする？`} onClose={onClose}>
      <SectionLabel>動作</SectionLabel>
      <ChipRow>
        {actions.map((item) => (
          <Chip key={item} label={item} active={action === item} onPress={() => setAction(item)} />
        ))}
      </ChipRow>
      <View style={sheetStyles.buttonRow}>
        <PrimaryButton label="やめる" tone="secondary" onPress={onClose} />
        <PrimaryButton label="実行" disabled={!action} onPress={() => action && onSelect(action)} />
      </View>
    </BottomSheet>
  );
}

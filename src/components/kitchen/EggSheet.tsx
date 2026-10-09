import { Text, View } from "react-native";
import { BottomSheet, PrimaryButton, sheetStyles } from "./BottomSheet";

type Props = {
  visible: boolean;
  toolName: string;
  onClose: () => void;
  // cracked: true なら割り入れる、false なら殻ごと入れる（ゆで卵など）
  onSelect: (cracked: boolean) => void;
};

// 卵を器に入れるとき、割り入れるか殻ごと入れるかを選ぶ
export function EggSheet({ visible, toolName, onClose, onSelect }: Props) {
  return (
    <BottomSheet visible={visible} title={`卵を${toolName}に入れる`} onClose={onClose}>
      <Text style={sheetStyles.hint}>ゆで卵を作るときは「殻ごと入れる」を選びます。</Text>
      <View style={sheetStyles.buttonRow}>
        <PrimaryButton label="殻ごと入れる" tone="secondary" onPress={() => onSelect(false)} />
        <PrimaryButton label="割り入れる" onPress={() => onSelect(true)} />
      </View>
    </BottomSheet>
  );
}

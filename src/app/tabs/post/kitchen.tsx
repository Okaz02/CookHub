import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../../theme";
import { IngredientSetup } from "../../../components/kitchen/IngredientSetup";
import { KitchenEditor } from "../../../components/kitchen/KitchenEditor";
import { setKitchenDraft } from "../../../lib/kitchen/kitchenDraft";
import type { IngredientSeed } from "../../../lib/kitchen/reducer";

// キッチンでレシピを作る画面。
//   1. 材料を入力（画像を自動で探す）
//   2. キッチンで材料や器具を動かして調理する
//   3. 記録された操作からレシピを生成し、編集画面へ渡す
export default function KitchenScreen() {
  const router = useRouter();
  const [seeds, setSeeds] = useState<IngredientSeed[] | null>(null);

  if (seeds) {
    return (
      <KitchenEditor
        seeds={seeds}
        onBack={() =>
          Alert.alert("材料の入力に戻りますか？", "キッチンでの操作はリセットされます。", [
            { text: "キャンセル", style: "cancel" },
            { text: "戻る", style: "destructive", onPress: () => setSeeds(null) },
          ])
        }
        onFinish={(result) => {
          setKitchenDraft(result);
          router.replace({ pathname: "/tabs/post/write", params: { from: "kitchen" } });
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={6}>
          <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.headerTitle}>材料をそろえる</Text>
        <View style={{ width: 28 }} />
      </View>
      <IngredientSetup onStart={setSeeds} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
});

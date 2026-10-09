import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../theme";
import {
  emojiImage,
  isBackgroundRemovalAvailable,
  isGoogleSearchAvailable,
  removeBackground,
  searchIngredientImages,
} from "../../lib/kitchen/imageSearch";
import {
  catalogImage,
  findCatalogIngredient,
  suggestIngredients,
  type CatalogIngredient,
} from "../../lib/kitchen/ingredientCatalog";
import type { IngredientSeed } from "../../lib/kitchen/reducer";
import type { IngredientImage } from "../../lib/kitchen/types";
import { IngredientArt } from "./IngredientSprite";

type Row = {
  key: string;
  name: string;
  amount: string;
  unit: string;
  // 画像を検索したときの材料名（名前が変わったら検索し直す）
  searchedName: string;
  candidates: IngredientImage[];
  image: IngredientImage | null;
  status: "idle" | "searching" | "removing";
};

let rowSeed = 0;
function emptyRow(): Row {
  rowSeed += 1;
  return { key: `row-${rowSeed}`, name: "", amount: "", unit: "", searchedName: "", candidates: [], image: null, status: "idle" };
}

const SOURCE_LABEL: Record<IngredientImage["source"], string> = {
  catalog: "収録済みの写真",
  google: "Google・透過",
  removebg: "背景透過済み",
  wikimedia: "Wikimedia",
  wikipedia: "Wikipedia・切り抜き表示",
  emoji: "絵文字",
};

type Props = {
  onStart: (seeds: IngredientSeed[]) => void;
};

export function IngredientSetup({ onStart }: Props) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  // 入力中の行（その行の下に、近い名前の材料を候補として出す）
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  // 検索中に名前が書き換えられた場合、古い結果で上書きしないための番号
  const requestIds = useRef<Record<string, number>>({});

  function patchRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  async function search(row: Row) {
    const name = row.name.trim();
    if (!name || name === row.searchedName) return;
    const requestId = (requestIds.current[row.key] ?? 0) + 1;
    requestIds.current[row.key] = requestId;
    // 一覧にある材料なら、収録済みの写真を先頭にする
    const known = findCatalogIngredient(name);
    const knownImages = known ? [catalogImage(known)] : [];
    patchRow(row.key, {
      status: "searching",
      searchedName: name,
      candidates: knownImages,
      image: knownImages[0] ?? null,
    });
    let found: IngredientImage[];
    try {
      found = await searchIngredientImages(name);
    } catch {
      found = [emojiImage(name)];
    }
    if (requestIds.current[row.key] !== requestId) return;
    // 収録済みの写真があるときは、検索結果の最後の絵文字は要らない
    const candidates = known ? [...knownImages, ...found.filter((image) => image.source !== "emoji")] : found;
    patchRow(row.key, { status: "idle", candidates, image: candidates[0] ?? null });
  }

  // 候補のタグを押したら、その材料の名前と写真を入れる
  function pick(row: Row, item: CatalogIngredient) {
    requestIds.current[row.key] = (requestIds.current[row.key] ?? 0) + 1;
    const image = catalogImage(item);
    patchRow(row.key, { name: item.name, searchedName: item.name, candidates: [image], image, status: "idle" });
  }

  async function cutOut(row: Row) {
    if (!row.image) return;
    patchRow(row.key, { status: "removing" });
    const result = await removeBackground(row.image);
    if (!result) {
      patchRow(row.key, { status: "idle" });
      return;
    }
    setRows((prev) =>
      prev.map((item) =>
        item.key === row.key
          ? { ...item, status: "idle", image: result, candidates: [result, ...item.candidates] }
          : item
      )
    );
  }

  const filled = rows.filter((row) => row.name.trim());
  const isBusy = rows.some((row) => row.status !== "idle");

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>まず使う材料を入力しましょう。画像は自動で探して棚に並べます。</Text>
        {!isGoogleSearchAvailable() ? (
          <Text style={styles.notice}>
            Google画像検索のキーが未設定のため、Wikipedia の写真（丸く切り抜いて表示）と絵文字を使います。
          </Text>
        ) : null}

        {rows.map((row) => (
          <View key={row.key} style={styles.card}>
            <View style={styles.inputRow}>
              <View style={styles.thumb}>
                {row.status === "searching" ? (
                  <ActivityIndicator color={colors.roastedBean} />
                ) : row.image ? (
                  <IngredientArt image={row.image} name={row.name} size={44} />
                ) : (
                  <MaterialIcons name="image-search" size={22} color={colors.outline} />
                )}
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={row.name}
                onChangeText={(name) => patchRow(row.key, { name })}
                onFocus={() => setFocusedKey(row.key)}
                // Web ではタグを押すと先に入力欄のフォーカスが外れるので、少し待ってから候補を消す（押した操作を受け取るため）
                onBlur={() => setTimeout(() => setFocusedKey((key) => (key === row.key ? null : key)), 200)}
                onEndEditing={() => search(row)}
                onSubmitEditing={() => search(row)}
                placeholder="材料名（例: にんじん）"
                returnKeyType="search"
              />
              <TextInput
                style={[styles.input, { width: 54 }]}
                value={row.amount}
                onChangeText={(amount) => patchRow(row.key, { amount })}
                placeholder="分量"
              />
              <TextInput
                style={[styles.input, { width: 50 }]}
                value={row.unit}
                onChangeText={(unit) => patchRow(row.key, { unit })}
                placeholder="単位"
              />
              <Pressable
                hitSlop={6}
                onPress={() => setRows((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== row.key) : [emptyRow()]))}
              >
                <MaterialIcons name="close" size={18} color={colors.outline} />
              </Pressable>
            </View>

            {focusedKey === row.key ? <Suggestions row={row} onPick={(item) => pick(row, item)} /> : null}

            {row.candidates.length > 0 ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.candidateRow}>
                  {row.candidates.map((candidate, index) => {
                    const active = row.image === candidate;
                    return (
                      <Pressable
                        key={`${candidate.uri ?? candidate.emoji}-${index}`}
                        style={[styles.candidate, active && styles.candidateActive]}
                        onPress={() => patchRow(row.key, { image: candidate })}
                      >
                        <IngredientArt image={candidate} name={row.name} size={48} />
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{row.image ? SOURCE_LABEL[row.image.source] : ""}</Text>
                  {row.image?.uri && !row.image.transparent && isBackgroundRemovalAvailable() ? (
                    <Pressable style={styles.smallButton} onPress={() => cutOut(row)} disabled={row.status !== "idle"}>
                      {row.status === "removing" ? (
                        <ActivityIndicator size="small" color={colors.linenCream} />
                      ) : (
                        <Text style={styles.smallButtonText}>背景を透過</Text>
                      )}
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => search({ ...row, searchedName: "" })} hitSlop={6}>
                    <Text style={styles.link}>再検索</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        ))}

        <Pressable style={styles.addRow} onPress={() => setRows((prev) => [...prev, emptyRow()])}>
          <MaterialIcons name="add" size={18} color={colors.roastedBean} />
          <Text style={styles.addRowText}>材料を追加する</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.startButton, (filled.length === 0 || isBusy) && { opacity: 0.4 }]}
          disabled={filled.length === 0 || isBusy}
          onPress={() =>
            onStart(
              filled.map((row) => ({
                name: row.name.trim(),
                amount: row.amount.trim(),
                unit: row.unit.trim(),
                image: row.image ?? emojiImage(row.name),
              }))
            )
          }
        >
          <MaterialIcons name="soup-kitchen" size={18} color={colors.linenCream} />
          <Text style={styles.startButtonText}>キッチンへ（{filled.length}品）</Text>
        </Pressable>
      </View>
    </View>
  );
}

// 入力中の名前に近い材料をタグで並べる（「肉」「野菜」など分類名でも出る）。選び終わった名前には出さない
function Suggestions({ row, onPick }: { row: Row; onPick: (item: CatalogIngredient) => void }) {
  const query = row.name.trim();
  const items = suggestIngredients(query);
  if (items.length === 0 || (items[0].name === query && row.searchedName === query)) return null;
  return (
    <View style={styles.suggestions}>
      {items.map((item) => (
        <Pressable key={item.id} style={styles.suggestion} onPress={() => onPick(item)}>
          <IngredientArt image={catalogImage(item)} name={item.name} size={26} />
          <Text style={styles.suggestionText}>{item.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  lead: {
    fontSize: 13,
    color: colors.onSurface,
  },
  notice: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
  },
  card: {
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainer,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.onSurface,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 3,
    paddingRight: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.onSurface,
  },
  candidateRow: {
    gap: 8,
  },
  candidate: {
    padding: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surfaceContainerLow,
  },
  candidateActive: {
    borderColor: colors.roastedBean,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  meta: {
    flex: 1,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  smallButton: {
    minWidth: 84,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.mutedForest,
  },
  smallButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.linenCream,
  },
  link: {
    fontSize: 11,
    color: colors.roastedBean,
    textDecorationLine: "underline",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.outline,
  },
  addRowText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.roastedBean,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.roastedBean,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.linenCream,
  },
});

import { useEffect, useReducer, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors } from "../../theme";
import { BURNER_COUNT, getHeatLevel } from "../../lib/kitchen/constants";
import { getSavedCustomTools, saveCustomTool } from "../../lib/kitchen/kitchenDraft";
import { computeLayout, pointInRect, type Point, type Rect } from "../../lib/kitchen/layout";
import {
  createInitialState,
  ingredientsInTool,
  isContainer,
  isHeatable,
  kitchenReducer,
  toolOnBurner,
  type IngredientSeed,
  type KitchenSnapshot,
} from "../../lib/kitchen/reducer";
import { generateIngredients, generateSteps } from "../../lib/kitchen/recipeGenerator";
import type { CutResult, HeatLevel, KitchenIngredient, KitchenTool } from "../../lib/kitchen/types";
import type { Ingredient, Step } from "../../lib/api-recipe";
import { CustomToolSheet } from "./CustomToolSheet";
import { CutSheet } from "./CutSheet";
import { Draggable } from "./Draggable";
import { FocusSheet, type FocusTarget } from "./FocusSheet";
import { HeatSheet } from "./HeatSheet";
import { IngredientSprite } from "./IngredientSprite";
import { KitchenBackground } from "./KitchenBackground";
import { RecipePreview } from "./RecipePreview";
import { ToolActionSheet } from "./ToolActionSheet";
import { CuttingKnife, ToolSprite } from "./ToolSprite";
import { WaterSheet } from "./WaterSheet";

type Sheet =
  | { type: "cut"; ingredientId: string }
  | { type: "water"; toolId: string }
  | { type: "heat"; toolId: string }
  | { type: "toolAction"; toolId: string; ingredientId: string | null }
  | { type: "customTool" }
  | { type: "focus"; target: FocusTarget };

type Dragging = { kind: "ingredient" | "tool"; id: string } | null;

type Props = {
  seeds: IngredientSeed[];
  onBack: () => void;
  onFinish: (result: { ingredients: Ingredient[]; steps: Step[] }) => void;
};

// 次に何をすればいいかの案内
function nextHint(snapshot: KitchenSnapshot): string {
  const { ingredients, tools } = snapshot;
  const pot = tools.find((tool) => tool.kind === "pot");
  const onBoard = ingredients.filter((item) => item.location.area === "board");
  if (snapshot.events.length === 0) return "棚の材料をまな板へドラッグしてみましょう。";
  if (onBoard.some((item) => !item.cut)) return "包丁を材料の上にドラッグすると、切り方を選べます。";
  if (pot && pot.location.area !== "burner" && ingredientsInTool(snapshot, pot.id).length === 0) {
    return "鍋をコンロへドラッグしましょう。";
  }
  if (pot && pot.location.area === "burner" && pot.waterMl === 0) return "水を鍋へドラッグすると水を入れられます。";
  if (pot && pot.waterMl > 0 && !pot.heat) return "コンロの「火をつける」をタップして加熱しましょう。";
  if (pot?.boiling && onBoard.some((item) => item.cut)) return "切った材料を鍋へドラッグして入れましょう。";
  if (ingredients.some((item) => item.location.area === "shelf")) return "棚に残っている材料も使ってみましょう。";
  return "材料や器具をタップすると、何をしたか確認できます。";
}

function FastForwardBadge({ rect, level, minutes, onDone }: { rect: Rect; level: HeatLevel; minutes: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(minutes * 60);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  useEffect(() => {
    const total = minutes * 60;
    const steps = 20;
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setRemaining(Math.max(0, Math.round(total * (1 - count / steps))));
      if (count >= steps) {
        clearInterval(timer);
        onDoneRef.current();
      }
    }, 110);
    return () => clearInterval(timer);
  }, [minutes]);
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <View pointerEvents="none" style={[styles.fastForward, { left: rect.x + rect.w / 2 - 60, top: rect.y - 6 }]}>
      <MaterialIcons name="fast-forward" size={14} color="#fff" />
      <Text style={styles.fastForwardText}>
        {getHeatLevel(level).label} {mm}:{ss}
      </Text>
    </View>
  );
}

export function KitchenEditor({ seeds, onBack, onFinish }: Props) {
  const [state, dispatch] = useReducer(kitchenReducer, seeds, (initial) => createInitialState(initial));
  const snapshot = state.present;
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState<Dragging>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [cutting, setCutting] = useState<{ ingredientId: string; cut: CutResult } | null>(null);
  const [fastForward, setFastForward] = useState<{ toolId: string; level: HeatLevel; minutes: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const steps = generateSteps(snapshot);

  const boardIngredients = snapshot.ingredients.filter((item) => item.location.area === "board");
  const layout = width
    ? computeLayout(width, {
        shelf: snapshot.ingredients.length,
        board: boardIngredients.length,
        rack: snapshot.tools.length,
      })
    : null;

  function ingredientRect(ingredient: KitchenIngredient): Rect | null {
    if (!layout) return null;
    switch (ingredient.location.area) {
      case "shelf":
        // 棚の位置は固定（取り出した場所は空いたままにする）
        return layout.shelfSlot(snapshot.ingredients.indexOf(ingredient));
      case "board":
        return layout.boardSlot(boardIngredients.indexOf(ingredient));
      case "tool":
        return null;
    }
  }

  function toolRect(tool: KitchenTool): Rect | null {
    if (!layout) return null;
    if (tool.location.area === "burner") return layout.burnerToolRect(tool.location.index);
    return layout.rackSlot(snapshot.tools.indexOf(tool));
  }

  function hitIngredient(point: Point, excludeId?: string) {
    return snapshot.ingredients.find((item) => {
      if (item.id === excludeId) return false;
      const rect = ingredientRect(item);
      return rect ? pointInRect(point, rect) : false;
    });
  }

  function hitTool(point: Point, excludeId?: string) {
    return snapshot.tools.find((tool) => {
      if (tool.id === excludeId) return false;
      const rect = toolRect(tool);
      return rect ? pointInRect(point, rect) : false;
    });
  }

  function hitBurner(point: Point) {
    if (!layout) return -1;
    return layout.burners.findIndex((burner) => Math.hypot(point.x - burner.cx, point.y - burner.cy) <= burner.r * 1.1);
  }

  function dropIngredient(ingredient: KitchenIngredient, point: Point): boolean {
    if (!layout) return false;
    const tool = hitTool(point);
    if (tool) {
      if (tool.kind === "pot") {
        dispatch({ type: "addIngredientToTool", toolId: tool.id, ingredientId: ingredient.id });
        return true;
      }
      if (tool.kind === "custom") {
        setSheet({ type: "toolAction", toolId: tool.id, ingredientId: ingredient.id });
        return false;
      }
      if (tool.kind === "knife") setToast("包丁を材料の上へドラッグすると切れます。");
      return false;
    }
    if (pointInRect(point, layout.board) && ingredient.location.area !== "board") {
      dispatch({ type: "moveIngredient", ingredientId: ingredient.id, to: "board" });
      return true;
    }
    if (pointInRect(point, layout.shelf) && ingredient.location.area !== "shelf") {
      dispatch({ type: "moveIngredient", ingredientId: ingredient.id, to: "shelf" });
      return true;
    }
    if (hitBurner(point) >= 0) setToast("先に鍋などをコンロに置いてから入れましょう。");
    return false;
  }

  function dropTool(tool: KitchenTool, point: Point): boolean {
    if (!layout) return false;

    if (tool.kind === "knife") {
      const target = hitIngredient(point);
      if (!target) return false;
      if (target.location.area !== "board") {
        setToast("まな板の上に置いてから切りましょう。");
        return false;
      }
      setSheet({ type: "cut", ingredientId: target.id });
      return false;
    }

    if (tool.kind === "water") {
      const burner = hitBurner(point);
      const target = hitTool(point, tool.id) ?? (burner >= 0 ? toolOnBurner(snapshot, burner) : undefined);
      if (target && isContainer(target)) {
        setSheet({ type: "water", toolId: target.id });
      } else if (target || burner >= 0) {
        setToast("水は鍋など、中に入れられる器具へドラッグしましょう。");
      }
      return false;
    }

    if (isHeatable(tool)) {
      const burner = hitBurner(point);
      if (burner >= 0) {
        const occupant = toolOnBurner(snapshot, burner);
        if (occupant && occupant.id !== tool.id) {
          setToast(`このコンロには${occupant.name}が置いてあります。`);
          return false;
        }
        if (tool.location.area === "burner" && tool.location.index === burner) return false;
        dispatch({ type: "placeOnBurner", toolId: tool.id, burner });
        return true;
      }
    }

    if (tool.kind === "custom") {
      const target = hitIngredient(point);
      if (target) {
        setSheet({ type: "toolAction", toolId: tool.id, ingredientId: target.id });
        return false;
      }
    }

    if (tool.location.area === "burner" && pointInRect(point, layout.rack)) {
      dispatch({ type: "returnToRack", toolId: tool.id });
      return true;
    }
    return false;
  }

  function pressKnob(burner: number) {
    const tool = toolOnBurner(snapshot, burner);
    if (!tool) {
      setToast("鍋などをコンロにドラッグしてから火をつけましょう。");
      return;
    }
    setSheet({ type: "heat", toolId: tool.id });
  }

  function finish() {
    if (steps.length === 0) {
      setToast("まだ手順がありません。何か調理してみましょう。");
      return;
    }
    onFinish({ ingredients: generateIngredients(snapshot), steps });
  }

  const focusTarget = sheet?.type === "focus" ? sheet.target : null;
  const findTool = (id: string) => snapshot.tools.find((tool) => tool.id === id) ?? null;
  const findIngredient = (id: string | null) => (id ? (snapshot.ingredients.find((item) => item.id === id) ?? null) : null);
  const draggedTool = dragging?.kind === "tool" ? findTool(dragging.id) : null;
  const draggedIngredient = dragging?.kind === "ingredient" ? findIngredient(dragging.id) : null;

  const burnerHeat = Array.from({ length: BURNER_COUNT }, (_, index) => toolOnBurner(snapshot, index)?.heat ?? null);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={onBack} hitSlop={6}>
          <MaterialIcons name="arrow-back" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.headerTitle}>キッチン</Text>
        <Pressable
          style={[styles.headerButton, state.past.length === 0 && { opacity: 0.3 }]}
          onPress={() => dispatch({ type: "undo" })}
          disabled={state.past.length === 0}
          hitSlop={6}
        >
          <MaterialIcons name="undo" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
        <Pressable style={styles.addToolButton} onPress={() => setSheet({ type: "customTool" })}>
          <MaterialIcons name="add-box" size={16} color={colors.roastedBean} />
          <Text style={styles.addToolText}>器具</Text>
        </Pressable>
        <Pressable style={styles.finishButton} onPress={finish}>
          <Text style={styles.finishText}>レシピにする</Text>
        </Pressable>
      </View>

      <View style={styles.hintBar}>
        <MaterialIcons name="lightbulb-outline" size={14} color={colors.mutedForest} />
        <Text style={styles.hintText}>{nextHint(snapshot)}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        scrollEnabled={!dragging}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {layout ? (
          <View style={{ width: layout.width, height: layout.height }}>
            <KitchenBackground
              layout={layout}
              burnerHeat={burnerHeat}
              onPressKnob={pressKnob}
              highlight={{
                board: draggedIngredient?.location.area === "shelf",
                shelf: draggedIngredient?.location.area === "board",
                burners: draggedTool && isHeatable(draggedTool)
                  ? Array.from({ length: BURNER_COUNT }, (_, index) => !toolOnBurner(snapshot, index))
                  : undefined,
              }}
            />

            {snapshot.tools.map((tool) => {
              const rect = toolRect(tool);
              if (!rect) return null;
              const isCuttingKnife = tool.kind === "knife" && cutting;
              return (
                <Draggable
                  key={tool.id}
                  rect={rect}
                  enabled={!cutting}
                  onDrop={(point) => dropTool(tool, point)}
                  onTap={() => setSheet({ type: "focus", target: { kind: "tool", id: tool.id } })}
                  onDragStart={() => setDragging({ kind: "tool", id: tool.id })}
                  onDragEnd={() => setDragging(null)}
                >
                  <View style={{ opacity: isCuttingKnife ? 0.25 : 1 }} pointerEvents="none">
                    <ToolSprite
                      tool={tool}
                      size={rect.w}
                      contents={ingredientsInTool(snapshot, tool.id)}
                      focused={focusTarget?.kind === "tool" && focusTarget.id === tool.id}
                    />
                  </View>
                </Draggable>
              );
            })}

            {snapshot.ingredients.map((ingredient) => {
              const rect = ingredientRect(ingredient);
              if (!rect) return null;
              return (
                <Draggable
                  key={ingredient.id}
                  rect={rect}
                  enabled={cutting?.ingredientId !== ingredient.id}
                  onDrop={(point) => dropIngredient(ingredient, point)}
                  onTap={() => setSheet({ type: "focus", target: { kind: "ingredient", id: ingredient.id } })}
                  onDragStart={() => setDragging({ kind: "ingredient", id: ingredient.id })}
                  onDragEnd={() => setDragging(null)}
                >
                  <IngredientSprite
                    ingredient={ingredient}
                    size={rect.w}
                    focused={focusTarget?.kind === "ingredient" && focusTarget.id === ingredient.id}
                  />
                  {cutting?.ingredientId === ingredient.id ? (
                    <CuttingKnife
                      size={rect.w}
                      onDone={() => {
                        dispatch({ type: "cut", ingredientId: cutting.ingredientId, cut: cutting.cut });
                        setCutting(null);
                      }}
                    />
                  ) : null}
                </Draggable>
              );
            })}

            {fastForward
              ? (() => {
                  const tool = findTool(fastForward.toolId);
                  const rect = tool ? toolRect(tool) : null;
                  return rect ? (
                    <FastForwardBadge
                      rect={rect}
                      level={fastForward.level}
                      minutes={fastForward.minutes}
                      onDone={() => setFastForward(null)}
                    />
                  ) : null;
                })()
              : null}
          </View>
        ) : null}
      </ScrollView>

      {toast ? (
        <View pointerEvents="none" style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <RecipePreview steps={steps} />

      {sheet?.type === "cut" ? (
        <CutSheet
          visible
          ingredientName={findIngredient(sheet.ingredientId)?.name ?? ""}
          onClose={() => setSheet(null)}
          onSelect={(cut) => {
            setSheet(null);
            setCutting({ ingredientId: sheet.ingredientId, cut });
          }}
        />
      ) : null}

      {sheet?.type === "water" ? (
        <WaterSheet
          visible
          toolName={findTool(sheet.toolId)?.name ?? ""}
          onClose={() => setSheet(null)}
          onSelect={(ml) => {
            dispatch({ type: "addWater", toolId: sheet.toolId, ml });
            setSheet(null);
          }}
        />
      ) : null}

      {sheet?.type === "heat" ? (
        <HeatSheet
          visible
          tool={findTool(sheet.toolId)}
          onClose={() => setSheet(null)}
          onHeat={(level, minutes) => {
            dispatch({ type: "heat", toolId: sheet.toolId, level, minutes });
            setFastForward({ toolId: sheet.toolId, level, minutes });
            setSheet(null);
          }}
          onTurnOff={() => {
            dispatch({ type: "turnOff", toolId: sheet.toolId });
            setSheet(null);
          }}
        />
      ) : null}

      {sheet?.type === "toolAction" ? (
        <ToolActionSheet
          visible
          tool={findTool(sheet.toolId)}
          ingredientName={findIngredient(sheet.ingredientId)?.name ?? null}
          onClose={() => setSheet(null)}
          onSelect={(choice) => {
            if (choice.action === null) {
              if (sheet.ingredientId) {
                dispatch({ type: "addIngredientToTool", toolId: sheet.toolId, ingredientId: sheet.ingredientId });
              }
            } else {
              dispatch({
                type: "toolAction",
                toolId: sheet.toolId,
                ingredientId: sheet.ingredientId ?? undefined,
                action: choice.action,
                putInside: choice.putInside,
                level: choice.level,
                minutes: choice.minutes,
              });
              if (choice.level && choice.minutes) {
                setFastForward({ toolId: sheet.toolId, level: choice.level, minutes: choice.minutes });
              }
            }
            setSheet(null);
          }}
        />
      ) : null}

      {sheet?.type === "customTool" ? (
        <CustomToolSheet
          visible
          savedTools={getSavedCustomTools()}
          onClose={() => setSheet(null)}
          onCreate={(definition) => {
            saveCustomTool(definition);
            dispatch({ type: "addCustomTool", definition });
            setToast(`${definition.name}を調理台に追加しました。`);
            setSheet(null);
          }}
        />
      ) : null}

      {sheet?.type === "focus" ? (
        <FocusSheet
          snapshot={snapshot}
          target={sheet.target}
          onClose={() => setSheet(null)}
          onFocus={(target) => setSheet({ type: "focus", target })}
          onToolAction={(toolId) => setSheet({ type: "toolAction", toolId, ingredientId: null })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ece6dc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  addToolButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.roastedBean,
  },
  addToolText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.roastedBean,
  },
  finishButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.roastedBean,
  },
  finishText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linenCream,
  },
  hintBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.secondaryContainer,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: colors.secondary,
  },
  fastForward: {
    position: "absolute",
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.75)",
    zIndex: 2000,
  },
  fastForwardText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 90,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(39,19,16,0.92)",
  },
  toastText: {
    fontSize: 13,
    color: colors.linenCream,
    textAlign: "center",
  },
});

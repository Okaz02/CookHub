import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { colors } from "../../theme";
import { getHeatLevel, MAX_BURNER_COUNT } from "../../lib/kitchen/constants";
import { getSavedCustomTools, saveCustomTool } from "../../lib/kitchen/kitchenDraft";
import {
  computeLayout,
  pointInRect,
  type KitchenLayout,
  type Point,
  type Rect,
  type ScrollArea,
} from "../../lib/kitchen/layout";
import {
  acceptsLid,
  createInitialState,
  ingredientsInTool,
  isContainer,
  isHeatable,
  kitchenReducer,
  lidOn,
  toolInSink,
  toolOnBurner,
  type IngredientSeed,
  type KitchenSnapshot,
} from "../../lib/kitchen/reducer";
import { applyActionsFor, isEgg } from "../../lib/kitchen/ingredientCatalog";
import { generateIngredients, generateSteps } from "../../lib/kitchen/recipeGenerator";
import type { HeatLevel, KitchenIngredient, KitchenTool } from "../../lib/kitchen/types";
import type { Ingredient, Step } from "../../lib/api-recipe";
import { CustomToolSheet } from "./CustomToolSheet";
import { CutSheet } from "./CutSheet";
import { EggSheet } from "./EggSheet";
import { ApplySheet } from "./ApplySheet";
import { Draggable } from "./Draggable";
import { FocusSheet, type FocusTarget } from "./FocusSheet";
import { HeatSheet } from "./HeatSheet";
import { IngredientSprite } from "./IngredientSprite";
import { DRAIN_DURATION_MS, KitchenBackground } from "./KitchenBackground";
import { RecipePreview } from "./RecipePreview";
import { ToolActionSheet } from "./ToolActionSheet";
import { contentSlots, toolBodyRect } from "./toolImages";
import { ToolSprite } from "./ToolSprite";
import { WaterSheet } from "./WaterSheet";

type Sheet =
  | { type: "cut"; ingredientId: string }
  | { type: "egg"; ingredientId: string; toolId: string }
  | { type: "apply"; ingredientId: string; targetId: string }
  // fromFaucet: シンクの蛇口から入れる（入れるときに蛇口から水を出す）
  | { type: "water"; toolId: string; fromFaucet?: boolean }
  | { type: "heat"; toolId: string }
  | { type: "toolAction"; toolId: string; ingredientId: string | null }
  | { type: "customTool" }
  | { type: "focus"; target: FocusTarget };

// スクロールする枠の中のものは、枠の外に出ると見えなくなるので、持ち上げた絵をキャンバスの一番上に描く。
// lifted はその開始位置（キャンバスに直接置いてあるものは null）
type Dragging = { kind: "ingredient" | "tool"; id: string; lifted: Rect | null } | null;

type AreaId = "shelf" | "rack" | "counter" | "board";

// 棚と器具置き場は1行で横に、調理台とまな板は縦にスクロールする
function isHorizontal(area: AreaId) {
  return area === "shelf" || area === "rack";
}

// area が null ならキャンバスに直接置く（rect はキャンバス座標）。そうでなければスクロールする枠の中身での位置
type Place = { area: AreaId | null; rect: Rect };

function scrollAreaOf(layout: KitchenLayout, area: AreaId): ScrollArea {
  switch (area) {
    case "shelf":
      return layout.shelfView;
    case "board":
      return layout.boardView;
    case "rack":
      return layout.rackView;
    case "counter":
      return layout.counterView;
  }
}

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
    <View style={[styles.fastForward, { pointerEvents: "none", left: rect.x + rect.w / 2 - 60, top: rect.y - 6 }]}>
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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState<Dragging>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [fastForward, setFastForward] = useState<{ toolId: string; level: HeatLevel; minutes: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // シンクの蛇口と、洗う・水を捨てるときに少しの間だけ出す演出
  const [faucetOn, setFaucetOn] = useState(false);
  // id は続けて同じ演出を出したときにアニメーションを最初からやり直すため
  const [sinkEffect, setSinkEffect] = useState<{ type: "faucet" | "drain"; id: number } | null>(null);
  const sinkEffectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (sinkEffectTimer.current) clearTimeout(sinkEffectTimer.current);
  }, []);

  function playSinkEffect(effect: "faucet" | "drain") {
    setSinkEffect((previous) => ({ type: effect, id: (previous?.id ?? 0) + 1 }));
    if (sinkEffectTimer.current) clearTimeout(sinkEffectTimer.current);
    sinkEffectTimer.current = setTimeout(() => setSinkEffect(null), DRAIN_DURATION_MS);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const steps = generateSteps(snapshot);

  const boardIngredients = snapshot.ingredients.filter((item) => item.location.area === "board");
  // 器具置き場と調理台は詰めて並べる（ほかへ移した器具の場所は空けない）
  const rackTools = snapshot.tools.filter((tool) => tool.location.area === "rack");
  const counterTools = snapshot.tools.filter((tool) => tool.location.area === "counter");
  const layout = size.width
    ? computeLayout(size.width, size.height, {
        shelf: snapshot.ingredients.length,
        board: boardIngredients.length,
        rack: rackTools.length,
        counter: counterTools.length,
        burners: snapshot.burnerCount,
      })
    : null;

  // いまのスクロール量（ドロップ位置の計算に使うだけなので ref で持つ）
  const scrollOffsets = useRef<Record<AreaId, number>>({ shelf: 0, rack: 0, counter: 0, board: 0 });

  // スクロールする枠の中身の左上が、いまキャンバス上のどこにあるか
  function scrollOrigin(area: AreaId): Point {
    if (!layout) return { x: 0, y: 0 };
    const { view } = scrollAreaOf(layout, area);
    const offset = scrollOffsets.current[area];
    return isHorizontal(area) ? { x: view.x - offset, y: view.y } : { x: view.x, y: view.y - offset };
  }

  function placeToCanvas(place: Place): Rect {
    if (!place.area) return place.rect;
    const origin = scrollOrigin(place.area);
    return { ...place.rect, x: origin.x + place.rect.x, y: origin.y + place.rect.y };
  }

  // キャンバス上の位置。スクロールして枠の外に隠れているものは null（当たり判定に使う）
  function visibleRect(place: Place | null): Rect | null {
    if (!place || !layout) return null;
    const rect = placeToCanvas(place);
    if (!place.area) return rect;
    const { view } = scrollAreaOf(layout, place.area);
    const visible =
      rect.x + rect.w > view.x && rect.x < view.x + view.w && rect.y + rect.h > view.y && rect.y < view.y + view.h;
    return visible ? rect : null;
  }

  function ingredientPlace(ingredient: KitchenIngredient): Place | null {
    if (!layout) return null;
    switch (ingredient.location.area) {
      case "shelf":
        // 棚の位置は固定（取り出した場所は空いたままにする）
        return { area: "shelf", rect: layout.shelfView.slot(snapshot.ingredients.indexOf(ingredient)) };
      case "board":
        return { area: "board", rect: layout.boardView.slot(boardIngredients.indexOf(ingredient)) };
      case "tool": {
        // 器具の中の材料は、器具と同じ枠の中で器の部分に並べる
        const hostId = ingredient.location.toolId;
        const host = snapshot.tools.find((tool) => tool.id === hostId);
        const hostPlace = host ? toolPlace(host) : null;
        if (!host || !hostPlace) return null;
        const contents = ingredientsInTool(snapshot, host.id);
        const slots = contentSlots(toolBodyRect(host, hostPlace.rect), contents.length);
        return { area: hostPlace.area, rect: slots[contents.indexOf(ingredient)] };
      }
    }
  }

  function toolPlace(tool: KitchenTool): Place | null {
    if (!layout) return null;
    switch (tool.location.area) {
      case "burner":
        return { area: null, rect: layout.burnerToolRect(tool.location.index) };
      case "sink":
        return { area: null, rect: layout.sinkToolRect };
      case "rack":
        return { area: "rack", rect: layout.rackView.slot(rackTools.indexOf(tool)) };
      case "counter":
        return { area: "counter", rect: layout.counterView.slot(counterTools.indexOf(tool)) };
      case "onTool": {
        // 蓋はかぶせた器具の器の部分に、少しだけ大きく重ねる（器具と同じ枠の中に置く）
        const hostId = tool.location.toolId;
        const host = snapshot.tools.find((item) => item.id === hostId);
        const hostPlace = host ? toolPlace(host) : null;
        if (!host || !hostPlace) return null;
        const body = toolBodyRect(host, hostPlace.rect);
        const size = Math.max(body.w, body.h) * 1.04;
        return {
          area: hostPlace.area,
          rect: { x: body.x + body.w / 2 - size / 2, y: body.y + body.h / 2 - size / 2, w: size, h: size },
        };
      }
    }
  }

  const ingredientRect = (ingredient: KitchenIngredient) => visibleRect(ingredientPlace(ingredient));
  const toolRect = (tool: KitchenTool) => visibleRect(toolPlace(tool));

  // かぶせてある蓋の上に落としたときは、下の器具に落としたことにする
  function underLid(tool: KitchenTool) {
    if (tool.location.area !== "onTool") return tool;
    const hostId = tool.location.toolId;
    return snapshot.tools.find((item) => item.id === hostId) ?? tool;
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
    // 調味料などを別の材料に重ねたら、何をするか選ぶ（肉など、重ねても何もしない材料は下の処理へ）
    const targetIngredient = hitIngredient(point, ingredient.id);
    if (targetIngredient && applyActionsFor(ingredient.name).length > 0) {
      setSheet({ type: "apply", ingredientId: ingredient.id, targetId: targetIngredient.id });
      return false;
    }
    const hit = hitTool(point);
    const tool = hit ? underLid(hit) : undefined;
    if (tool && lidOn(snapshot, tool.id)) {
      setToast("蓋を外してから入れましょう。");
      return false;
    }
    if (tool) {
      // 鍋・フライパン・ボウルなどは、落とした材料をそのまま入れる。
      // 火を使う動作はコンロで、それ以外の動作は器具をタップして選ぶ
      if (isContainer(tool)) {
        // 卵は、割り入れるか殻ごと入れるかを選ぶ
        if (isEgg(ingredient.name) && !ingredient.cracked) {
          setSheet({ type: "egg", ingredientId: ingredient.id, toolId: tool.id });
          return false;
        }
        dispatch({ type: "addIngredientToTool", toolId: tool.id, ingredientId: ingredient.id });
        return true;
      }
      // ピーラーなど中に入れられない器具は、その材料に対して動作を選ぶ
      if (tool.kind === "custom") {
        setSheet({ type: "toolAction", toolId: tool.id, ingredientId: ingredient.id });
        return false;
      }
      if (tool.kind === "knife") setToast("包丁を材料の上へドラッグすると切れます。");
      return false;
    }
    const inTool = ingredient.location.area === "tool";
    if (pointInRect(point, layout.sink) && !inTool) {
      dispatch({ type: "wash", ingredientId: ingredient.id });
      playSinkEffect("faucet");
      // 洗ったら元の場所に戻す
      return false;
    }
    if (pointInRect(point, layout.board) && ingredient.location.area !== "board") {
      dispatch({ type: "moveIngredient", ingredientId: ingredient.id, to: "board" });
      return true;
    }
    if (pointInRect(point, layout.shelf) && inTool) {
      setToast("器具から出した材料は、まな板に置きましょう。");
      return false;
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

    // 包丁を材料の上に落とすと切る（材料が無ければ下の「置く」へ）
    if (tool.kind === "knife") {
      const target = hitIngredient(point);
      if (target) {
        if (target.location.area !== "board") {
          setToast("まな板の上に置いてから切りましょう。");
          return false;
        }
        setSheet({ type: "cut", ingredientId: target.id });
        return false;
      }
    }

    if (tool.kind === "lid") {
      const burner = hitBurner(point);
      const hit = hitTool(point, tool.id) ?? (burner >= 0 ? toolOnBurner(snapshot, burner) : undefined);
      const target = hit ? underLid(hit) : undefined;
      if (target && acceptsLid(target)) {
        if (tool.location.area === "onTool" && tool.location.toolId === target.id) return false;
        if (lidOn(snapshot, target.id)) return false;
        dispatch({ type: "putLid", lidId: tool.id, toolId: target.id });
        return true;
      }
      if (target) {
        setToast("この蓋はフライパン用です。");
        return false;
      }
    }

    if (isContainer(tool) && pointInRect(point, layout.sink)) {
      if (tool.location.area === "sink") return false;
      const occupant = toolInSink(snapshot);
      if (tool.heat) {
        setToast("火を止めてからシンクへ運びましょう。");
      } else if (occupant) {
        setToast(`シンクには${occupant.name}が置いてあります。`);
      } else {
        dispatch({ type: "placeInSink", toolId: tool.id });
        return true;
      }
      return false;
    }

    if (tool.kind === "water") {
      const burner = hitBurner(point);
      const hit = hitTool(point, tool.id) ?? (burner >= 0 ? toolOnBurner(snapshot, burner) : undefined);
      const target = hit ? underLid(hit) : undefined;
      if (target || burner >= 0) {
        if (target && lidOn(snapshot, target.id)) {
          setToast("蓋を外してから水を入れましょう。");
        } else if (target && isContainer(target)) {
          setSheet({ type: "water", toolId: target.id });
        } else {
          setToast("水は鍋など、中に入れられる器具へドラッグしましょう。");
        }
        return false;
      }
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

    // 器具置き場か調理台に置く
    const to = pointInRect(point, layout.rack) ? "rack" : pointInRect(point, layout.counter) ? "counter" : null;
    if (to && tool.location.area !== to) {
      dispatch({ type: "putDownTool", toolId: tool.id, to });
      return true;
    }
    // かぶせてあった蓋は、ほかの場所に落とすと外れて器具置き場に戻る
    if (tool.location.area === "onTool") {
      dispatch({ type: "putDownTool", toolId: tool.id, to: "rack" });
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

  const sinkTool = toolInSink(snapshot);
  const burnerHeat = Array.from({ length: snapshot.burnerCount }, (_, index) => toolOnBurner(snapshot, index)?.heat ?? null);

  // 持ち上げ中の材料の動いた量（Draggable が書き込む）
  const liftX = useSharedValue(0);
  const liftY = useSharedValue(0);
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: liftX.get() }, { translateY: liftY.get() }, { scale: 1.12 }],
  }));

  // スクロールする枠の中のものは、スクロールと違う向きに動かすか、長押ししてからドラッグする。
  // 枠の外に出ると見えなくなるので、ドラッグ中はキャンバスの一番上に持ち上げた絵を出す
  function renderDraggable(
    item: { kind: "ingredient" | "tool"; id: string },
    place: Place,
    handlers: { onDrop: (point: Point) => boolean; onTap: () => void },
    sprite: ReactNode
  ) {
    const { area } = place;
    return (
      <Draggable
        key={item.id}
        rect={place.rect}
        origin={area ? () => scrollOrigin(area) : undefined}
        scrollAxis={area ? (isHorizontal(area) ? "x" : "y") : undefined}
        lift={area ? { x: liftX, y: liftY } : undefined}
        onDrop={(point) => {
          // 置き場所が変わって別の枠へ移ると、この Draggable は消えてドラッグ終了が呼ばれないのでここで終える
          setDragging(null);
          return handlers.onDrop(point);
        }}
        onTap={handlers.onTap}
        onDragStart={() => setDragging({ ...item, lifted: area ? placeToCanvas(place) : null })}
        onDragEnd={() => setDragging(null)}
      >
        {sprite}
      </Draggable>
    );
  }

  function ingredientSprite(ingredient: KitchenIngredient, size: number, focusable = true) {
    return (
      <IngredientSprite
        ingredient={ingredient}
        size={size}
        // 器具の中では小さいので名前は出さない
        showLabel={ingredient.location.area !== "tool"}
        focused={focusable && focusTarget?.kind === "ingredient" && focusTarget.id === ingredient.id}
      />
    );
  }

  // 中の材料はふだんは別にドラッグできるように描くので、器具の絵には含めない。
  // 器具ごと動かしている間だけ、器具の絵の中に描いて一緒に動かす
  function toolSprite(tool: KitchenTool, rect: Rect, focusable = true, withContents = false) {
    return (
      <View style={{ pointerEvents: "none" }}>
        <ToolSprite
          tool={tool}
          size={rect.w}
          height={rect.h}
          contents={withContents ? ingredientsInTool(snapshot, tool.id) : []}
          focused={focusable && focusTarget?.kind === "tool" && focusTarget.id === tool.id}
        />
      </View>
    );
  }

  function renderIngredient(ingredient: KitchenIngredient) {
    const place = ingredientPlace(ingredient);
    if (!place) return null;
    return renderDraggable(
      { kind: "ingredient", id: ingredient.id },
      place,
      {
        onDrop: (point) => dropIngredient(ingredient, point),
        onTap: () => setSheet({ type: "focus", target: { kind: "ingredient", id: ingredient.id } }),
      },
      ingredientSprite(ingredient, place.rect.w)
    );
  }

  function renderTool(tool: KitchenTool) {
    const place = toolPlace(tool);
    if (!place) return null;
    const covering = tool.location.area === "onTool";
    return renderDraggable(
      { kind: "tool", id: tool.id },
      place,
      {
        onDrop: (point) => dropTool(tool, point),
        // かぶせてある蓋はタップで外す
        onTap: () =>
          covering
            ? dispatch({ type: "putDownTool", toolId: tool.id, to: "rack" })
            : setSheet({ type: "focus", target: { kind: "tool", id: tool.id } }),
      },
      toolSprite(tool, place.rect, true, isDraggingTool(tool.id))
    );
  }

  function renderScrollArea(area: AreaId, children: ReactNode) {
    if (!layout) return null;
    const { view, contentWidth, contentHeight } = scrollAreaOf(layout, area);
    const horizontal = isHorizontal(area);
    return (
      <ScrollView
        horizontal={horizontal}
        style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h }}
        scrollEnabled={!dragging}
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const offset = event.nativeEvent.contentOffset;
          scrollOffsets.current[area] = horizontal ? offset.x : offset.y;
        }}
      >
        <View
          style={{
            width: horizontal ? Math.max(contentWidth, view.w) : view.w,
            height: horizontal ? view.h : Math.max(contentHeight, view.h),
          }}
        >
          {children}
        </View>
      </ScrollView>
    );
  }

  function isDraggingTool(toolId: string) {
    return dragging?.kind === "tool" && dragging.id === toolId;
  }

  // 器具の中の材料（器具ごと動かしている間は器具の絵の中に描くので除く）
  function contentsIn(area: AreaId | null) {
    return snapshot.ingredients.filter(
      (item) =>
        item.location.area === "tool" &&
        !isDraggingTool(item.location.toolId) &&
        ingredientPlace(item)?.area === area
    );
  }

  // 置き場所ごとに分ける。器具 → 中の材料 → かぶせてある蓋の順に、手前へ重ねて描く
  const toolsOnCanvas = snapshot.tools.filter((tool) => toolPlace(tool)?.area === null);
  // 器具置き場・調理台の中身：器具 → 中の材料 → かぶせてある蓋の順に重ねる
  function toolsArea(area: "rack" | "counter", tools: KitchenTool[]) {
    const lids = snapshot.tools.filter((tool) => tool.location.area === "onTool" && toolPlace(tool)?.area === area);
    return renderScrollArea(area, [
      ...tools.map(renderTool),
      ...contentsIn(area).map(renderIngredient),
      ...lids.map(renderTool),
    ]);
  }

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

      {/* gesture-handler の ScrollView だと材料・器具のドラッグを横取りすることがあるので、RN 標準のものを使う */}
      <ScrollView
        style={{ flex: 1 }}
        scrollEnabled={!dragging}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize({ width, height });
        }}
      >
        {layout ? (
          <View style={{ width: layout.width, height: layout.height }}>
            <KitchenBackground
              layout={layout}
              burnerHeat={burnerHeat}
              onPressKnob={pressKnob}
              onAddBurner={
                snapshot.burnerCount < MAX_BURNER_COUNT ? () => dispatch({ type: "addBurner" }) : null
              }
              faucetOn={faucetOn}
              faucetBurst={sinkEffect?.type === "faucet"}
              drainingId={sinkEffect?.type === "drain" ? sinkEffect.id : null}
              onToggleFaucet={() => setFaucetOn((on) => !on)}
              sinkTool={
                sinkTool
                  ? {
                      hasWater: sinkTool.waterMl > 0,
                      withIngredients: ingredientsInTool(snapshot, sinkTool.id).length > 0,
                    }
                  : null
              }
              onFillSinkTool={() => {
                if (!sinkTool) return;
                if (lidOn(snapshot, sinkTool.id)) {
                  setToast("蓋を外してから水を入れましょう。");
                  return;
                }
                setSheet({ type: "water", toolId: sinkTool.id, fromFaucet: true });
              }}
              onDrainSinkTool={() => {
                if (!sinkTool) return;
                dispatch({ type: "drain", toolId: sinkTool.id });
                playSinkEffect("drain");
              }}
              highlight={{
                board: Boolean(draggedIngredient && draggedIngredient.location.area !== "board"),
                shelf: draggedIngredient?.location.area === "board",
                sink:
                  Boolean(draggedIngredient && draggedIngredient.location.area !== "tool") ||
                  Boolean(draggedTool && isContainer(draggedTool) && !sinkTool && !draggedTool.heat),
                burners: draggedTool && isHeatable(draggedTool)
                  ? Array.from({ length: snapshot.burnerCount }, (_, index) => !toolOnBurner(snapshot, index))
                  : undefined,
              }}
            />

            {toolsOnCanvas.filter((tool) => tool.location.area !== "onTool").map(renderTool)}

            {renderScrollArea("shelf", snapshot.ingredients.filter((item) => item.location.area === "shelf").map(renderIngredient))}
            {renderScrollArea("board", boardIngredients.map(renderIngredient))}
            {toolsArea("rack", rackTools)}
            {toolsArea("counter", counterTools)}
            {contentsIn(null).map(renderIngredient)}

            {/* かぶせてある蓋は材料より手前に描く */}
            {toolsOnCanvas.filter((tool) => tool.location.area === "onTool").map(renderTool)}

            {dragging?.lifted ? (
              <Animated.View
                style={[
                  styles.lifted,
                  {
                    left: dragging.lifted.x,
                    top: dragging.lifted.y,
                    width: dragging.lifted.w,
                    height: dragging.lifted.h,
                  },
                  liftStyle,
                ]}
              >
                {draggedIngredient ? ingredientSprite(draggedIngredient, dragging.lifted.w, false) : null}
                {draggedTool ? toolSprite(draggedTool, dragging.lifted, false, true) : null}
              </Animated.View>
            ) : null}

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
        <View style={[styles.toast, { pointerEvents: "none" }]}>
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
            dispatch({ type: "cut", ingredientId: sheet.ingredientId, cut });
          }}
        />
      ) : null}

      {sheet?.type === "apply" ? (
        <ApplySheet
          visible
          ingredientName={findIngredient(sheet.ingredientId)?.name ?? ""}
          targetName={findIngredient(sheet.targetId)?.name ?? ""}
          actions={applyActionsFor(findIngredient(sheet.ingredientId)?.name ?? "")}
          onClose={() => setSheet(null)}
          onSelect={(action) => {
            dispatch({ type: "applyIngredient", ingredientId: sheet.ingredientId, targetId: sheet.targetId, action });
            setSheet(null);
          }}
        />
      ) : null}

      {sheet?.type === "egg" ? (
        <EggSheet
          visible
          toolName={findTool(sheet.toolId)?.name ?? ""}
          onClose={() => setSheet(null)}
          onSelect={(cracked) => {
            dispatch(
              cracked
                ? { type: "crackEgg", toolId: sheet.toolId, ingredientId: sheet.ingredientId }
                : { type: "addIngredientToTool", toolId: sheet.toolId, ingredientId: sheet.ingredientId }
            );
            setSheet(null);
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
            if (sheet.fromFaucet) playSinkEffect("faucet");
            setSheet(null);
          }}
        />
      ) : null}

      {sheet?.type === "heat" ? (
        <HeatSheet
          visible
          tool={findTool(sheet.toolId)}
          onClose={() => setSheet(null)}
          onHeat={(level, minutes, action) => {
            dispatch({ type: "heat", toolId: sheet.toolId, level, minutes, action });
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
                count: choice.count,
              });
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
            setToast(`${definition.name}を器具置き場に追加しました。`);
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
  lifted: {
    position: "absolute",
    zIndex: 3000,
    elevation: 14,
    pointerEvents: "none",
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
    // 下のレシピパネルを広げても隠れないよう、案内バーのすぐ下に出す
    top: 96,
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

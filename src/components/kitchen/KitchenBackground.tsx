import { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { getHeatLevel } from "../../lib/kitchen/constants";
import { SlicedImage } from "../SlicedImage";
import type { Circle, KitchenLayout, Rect } from "../../lib/kitchen/layout";
import type { ActiveHeat } from "../../lib/kitchen/types";

type Props = {
  layout: KitchenLayout;
  // バーナーごとの火の状態（null は消火）
  burnerHeat: (ActiveHeat | null)[];
  // ドラッグ中の物を置けそうな場所を強調する
  highlight: { board?: boolean; shelf?: boolean; sink?: boolean; burners?: boolean[] };
  onPressKnob: (burner: number) => void;
  // null のときは＋ボタンを出さない（もう増やせない）
  onAddBurner: (() => void) | null;
  faucetOn: boolean;
  // 材料を洗う・器具に水を入れる間は、少しのあいだ蛇口から水を出す
  faucetBurst: boolean;
  // 器具の水（お湯）を捨てている間は、排水溝に水が吸い込まれる様子を出す。
  // 捨てるたびに変わる番号で、続けて捨てたときもアニメーションを最初から出す
  drainingId: number | null;
  onToggleFaucet: () => void;
  // シンクに置いてある器具。あるときは蛇口のボタンが「水を入れる」になり、水が入っていれば捨てるボタンも出す
  sinkTool: { hasWater: boolean; withIngredients: boolean } | null;
  onFillSinkTool: () => void;
  onDrainSinkTool: () => void;
};

// 五徳の画像（1352x1163）。ゴトクの爪がバーナーの円より少しはみ出す大きさで描く
const BURNER_IMAGE_ASPECT = 1163 / 1352;
const BURNER_IMAGE_SCALE = 2.2;
const DRAIN_SIZE = 40;
const FAUCET_HEIGHT = 22;
export const DRAIN_DURATION_MS = 1400;

// 棚と器具置き場の背景。木の枠と真ん中の仕切りは伸ばさず、2つの窓（透明）だけを伸ばす
const SHELF_IMAGE = {
  source: require("./images/shelf.png"),
  cols: [
    { percent: 8.54, stretch: false },
    { percent: 38.62, stretch: true },
    { percent: 5.89, stretch: false },
    { percent: 38.41, stretch: true },
    { percent: 8.54, stretch: false },
  ],
  rows: [
    { percent: 8.84, stretch: false },
    { percent: 57.82, stretch: true },
    { percent: 33.34, stretch: false },
  ],
  scale: 1.3,
};

// ドラッグ中に、置けそうな場所を点線で囲む。場所そのものに枠線を付けると内側が狭まって中身がずれるので、上に重ねて描く
function HighlightFrame({ rect, radius }: { rect: Rect; radius: number }) {
  return <View style={[styles.highlight, rectStyle(rect), { borderRadius: radius, pointerEvents: "none" }]} />;
}

function rectStyle(rect: Rect) {
  return { position: "absolute" as const, left: rect.x, top: rect.y, width: rect.w, height: rect.h };
}

function ZoneLabel({ icon, text, light }: { icon: string; text: string; light?: boolean }) {
  return (
    <View style={styles.zoneLabel}>
      <MaterialIcons name={icon as never} size={12} color={light ? "#f0e6dc" : "#5d4037"} />
      <Text style={[styles.zoneLabelText, light && { color: "#f0e6dc" }]}>{text}</Text>
    </View>
  );
}

function Flame({ burner, heat }: { burner: Circle; heat: ActiveHeat }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withSequence(withTiming(1, { duration: 420 }), withTiming(0, { duration: 420 })), -1));
  }, [pulse]);
  const level = getHeatLevel(heat.level);
  // 火が強いほど炎の輪が大きい
  const ratio = { low: 0.36, mediumLow: 0.44, medium: 0.52, high: 0.62 }[heat.level];
  const radius = burner.r * ratio;
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.get() * 0.45,
    transform: [{ scale: 0.96 + pulse.get() * 0.06 }],
  }));
  return (
    <Animated.View
      style={[
        styles.flame,
        {
          pointerEvents: "none",
          left: burner.cx - radius,
          top: burner.cy - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderColor: level.color,
          shadowColor: level.color,
        },
        animatedStyle,
      ]}
    />
  );
}

// 蛇口から排水溝へ流れる水
function WaterStream({ centerX, top, height }: { centerX: number; top: number; height: number }) {
  const flow = useSharedValue(0);
  useEffect(() => {
    flow.set(withRepeat(withTiming(1, { duration: 500 }), -1));
  }, [flow]);
  const streamStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + Math.sin(flow.get() * Math.PI * 2) * 0.15,
    transform: [{ scaleX: 1 + Math.sin(flow.get() * Math.PI * 4) * 0.12 }],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.8 - flow.get() * 0.8,
    transform: [{ scale: 0.6 + flow.get() * 0.9 }],
  }));
  return (
    <>
      <Animated.View style={[styles.stream, { pointerEvents: "none", left: centerX - 4, top, height }, streamStyle]} />
      <Animated.View
        style={[
          styles.ripple,
          { pointerEvents: "none", left: centerX - DRAIN_SIZE / 2, top: top + height - DRAIN_SIZE / 2 },
          rippleStyle,
        ]}
      />
    </>
  );
}

// 器具から捨てた水が排水溝へ吸い込まれていく
function DrainSwirl({ centerX, centerY }: { centerX: number; centerY: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(1, { duration: DRAIN_DURATION_MS }));
  }, [progress]);
  const size = DRAIN_SIZE * 2.6;
  const poolStyle = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - progress.get()),
    transform: [{ scale: 1 - progress.get() * 0.7 }, { rotate: `${progress.get() * 540}deg` }],
  }));
  return (
    <Animated.View
      style={[
        styles.pool,
        {
          pointerEvents: "none",
          left: centerX - size / 2,
          top: centerY - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        poolStyle,
      ]}
    />
  );
}

export function KitchenBackground({
  layout,
  burnerHeat,
  highlight,
  onPressKnob,
  onAddBurner,
  faucetOn,
  faucetBurst,
  drainingId,
  onToggleFaucet,
  sinkTool,
  onFillSinkTool,
  onDrainSinkTool,
}: Props) {
  const { shelf, rack, counter, board, sink, stove, burners } = layout;
  return (
    <>
      <SlicedImage {...SHELF_IMAGE} style={rectStyle(shelf)}>
        <ZoneLabel icon="kitchen" text="棚（材料）" />
      </SlicedImage>

      <SlicedImage {...SHELF_IMAGE} style={rectStyle(rack)}>
        <ZoneLabel icon="soup-kitchen" text="器具" />
      </SlicedImage>

      <View style={[rectStyle(counter), styles.counter]}>
        {/* 大理石の模様は引き伸ばさず、縦横比を保ったまま調理台を覆う大きさにする（はみ出した分は切る） */}
        <Image source={require("./images/marble.jpg")} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <ZoneLabel icon="countertops" text="調理台" />
      </View>

      <SlicedImage
        source={require("./images/board.png")}
        // 手前（下）に持ち手の穴がある
        cols={[
          { percent: 6, stretch: false },
          { percent: 88, stretch: true },
          { percent: 6, stretch: false },
        ]}
        rows={[
          { percent: 5, stretch: false },
          { percent: 77, stretch: true },
          { percent: 18, stretch: false },
        ]}
        scale={3.5}
        style={rectStyle(board)}
      />

      <SlicedImage
        source={require("./images/sink.png")}
        cols={[
          { percent: 25, stretch: false },
          { percent: 50, stretch: true },
          { percent: 25, stretch: false },
        ]}
        rows={[
          { percent: 25, stretch: false },
          { percent: 50, stretch: true },
          { percent: 25, stretch: false },
        ]}
        scale={16}
        style={rectStyle(sink)}
      >
        <Image
          source={require("./images/drain.png")}
          style={[
            styles.drain,
            { left: sink.w / 2 - DRAIN_SIZE / 2, top: sink.h / 2 - DRAIN_SIZE / 2 },
          ]}
        />
        <View style={[styles.faucet, { left: sink.w / 2 - 8 }]} />
        {drainingId !== null ? (
          <DrainSwirl key={drainingId} centerX={sink.w / 2} centerY={sink.h / 2} />
        ) : null}
        {faucetOn || faucetBurst ? <WaterStream centerX={sink.w / 2} top={FAUCET_HEIGHT} height={sink.h / 2 - FAUCET_HEIGHT} /> : null}
        <View style={styles.faucetButtonRow}>
          {sinkTool ? (
            <>
              <Pressable style={styles.faucetButton} onPress={onFillSinkTool} hitSlop={4}>
                <MaterialIcons name="water" size={14} color="#fff" />
                <Text style={styles.knobText}>水を入れる</Text>
              </Pressable>
              {sinkTool.hasWater ? (
                <Pressable style={styles.faucetButton} onPress={onDrainSinkTool} hitSlop={4}>
                  <MaterialIcons name="vertical-align-bottom" size={14} color="#fff" />
                  <Text style={styles.knobText}>{sinkTool.withIngredients ? "湯を切る" : "水を捨てる"}</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Pressable
              style={[styles.faucetButton, faucetOn && { backgroundColor: "#3d8bd9" }]}
              onPress={onToggleFaucet}
              hitSlop={6}
            >
              <MaterialIcons name="water" size={14} color="#fff" />
              <Text style={styles.knobText}>{faucetOn ? "水を止める" : "水を出す"}</Text>
            </Pressable>
          )}
        </View>
      </SlicedImage>

      <SlicedImage
        source={require("./images/konro.png")}
        cols={[
          { percent: 18.05, stretch: false },
          { percent: 63.9, stretch: true },
          { percent: 18.05, stretch: false },
        ]}
        rows={[
          { percent: 5.3, stretch: false },
          { percent: 89.4, stretch: true },
          { percent: 5.3, stretch: false },
        ]}
        scale={4}
        style={rectStyle(stove)}
      >
        <ZoneLabel icon="local-fire-department" text="コンロ" light />
        {onAddBurner ? (
          <Pressable style={styles.cornerButton} onPress={onAddBurner} hitSlop={6}>
            <MaterialIcons name="add" size={14} color="#fff" />
            <Text style={styles.knobText}>コンロを増やす</Text>
          </Pressable>
        ) : null}
      </SlicedImage>

      {highlight.shelf ? <HighlightFrame rect={shelf} radius={10} /> : null}
      {highlight.board ? <HighlightFrame rect={board} radius={12} /> : null}
      {highlight.sink ? <HighlightFrame rect={sink} radius={14} /> : null}

      {burners.map((burner, index) => {
        const heat = burnerHeat[index];
        const imageWidth = burner.r * BURNER_IMAGE_SCALE;
        const imageHeight = imageWidth * BURNER_IMAGE_ASPECT;
        return (
          <View key={`burner-${index}`}>
            <Image
              source={require("./images/fire.png")}
              style={{
                position: "absolute",
                left: burner.cx - imageWidth / 2,
                top: burner.cy - imageHeight / 2,
                width: imageWidth,
                height: imageHeight,
              }}
            />
            {highlight.burners?.[index] ? (
              <HighlightFrame
                rect={{ x: burner.cx - burner.r, y: burner.cy - burner.r, w: burner.r * 2, h: burner.r * 2 }}
                radius={burner.r}
              />
            ) : null}
            {heat ? <Flame burner={burner} heat={heat} /> : null}
            <Pressable
              style={[
                styles.knob,
                { left: burner.cx - layout.knobWidth / 2, top: burner.cy + burner.r + 6, width: layout.knobWidth },
                heat && { backgroundColor: getHeatLevel(heat.level).color },
              ]}
              onPress={() => onPressKnob(index)}
              hitSlop={6}
            >
              <MaterialIcons name="whatshot" size={14} color="#fff" />
              <Text style={styles.knobText} numberOfLines={1}>
                {heat ? `${getHeatLevel(heat.level).label}・${heat.minutes}分` : "火をつける"}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  zoneLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 5,
  },
  zoneLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5d4037",
  },
  counter: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#c9c9c9",
  },
  faucet: {
    position: "absolute",
    top: 0,
    width: 16,
    height: FAUCET_HEIGHT,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: "#b9bec4",
    borderWidth: 1,
    borderColor: "#7d838a",
  },
  stream: {
    position: "absolute",
    width: 8,
    borderRadius: 4,
    backgroundColor: "#9fd3ff",
  },
  pool: {
    position: "absolute",
    backgroundColor: "#9fd3ff",
    borderWidth: 3,
    borderColor: "#cfeaff",
    borderStyle: "dashed",
  },
  ripple: {
    position: "absolute",
    width: DRAIN_SIZE,
    height: DRAIN_SIZE,
    borderRadius: DRAIN_SIZE / 2,
    borderWidth: 2,
    borderColor: "#cfeaff",
  },
  faucetButtonRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: "center",
    gap: 4,
  },
  faucetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#55595e",
  },
  cornerButton: {
    position: "absolute",
    top: 6,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#55595e",
  },
  drain: {
    position: "absolute",
    width: DRAIN_SIZE,
    height: DRAIN_SIZE,
  },
  flame: {
    position: "absolute",
    borderWidth: 6,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  knob: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#55595e",
  },
  knobText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  highlight: {
    borderColor: "#ffb300",
    borderWidth: 3,
    borderStyle: "dashed",
  },
});

import { useEffect, type ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../theme";
import { getCatalogEntry, type ToolCatalogId } from "../../lib/kitchen/toolCatalog";
import type { KitchenIngredient, KitchenTool, ToolAppearance } from "../../lib/kitchen/types";
import { getImageSize } from "../imageSize";
import { IngredientSprite } from "./IngredientSprite";
import { contentSlots, placeToolImage, toolImageMode } from "./toolImages";

type Props = {
  tool: KitchenTool;
  // 枠の幅。height を省略すると正方形
  size: number;
  height?: number;
  contents?: KitchenIngredient[];
  focused?: boolean;
};

export function ToolSprite({ tool, size, height = size, contents = [], focused }: Props) {
  const box = { width: size, height };
  // 写真の器具は枠いっぱいに描く。図形で描く器具は正方形なので、枠の中央に置く
  const square = Math.min(size, height);
  const centered = (art: ReactNode) => <View style={[styles.center, box]}>{art}</View>;
  switch (tool.kind) {
    case "knife":
      return tool.catalogId ? (
        <ImageKnifeArt box={box} name={tool.name} catalogId={tool.catalogId} />
      ) : (
        centered(<KnifeArt size={square} />)
      );
    case "water":
      return tool.catalogId ? <GlassArt box={box} catalogId={tool.catalogId} /> : centered(<WaterArt size={square} />);
    case "lid":
      return <LidArt box={box} name={tool.name} focused={focused} covering={tool.location.area === "onTool"} />;
    case "pot":
      if (tool.catalogId) {
        return (
          <ImageVesselArt box={box} tool={tool} catalogId={tool.catalogId} contents={contents} focused={focused} />
        );
      }
      return centered(
        <VesselArt size={square} tool={tool} contents={contents} focused={focused} appearance={POT_APPEARANCE} withHandles />
      );
    case "custom": {
      const appearance = tool.definition?.appearance ?? POT_APPEARANCE;
      if (tool.catalogId) {
        return (
          <ImageVesselArt box={box} tool={tool} catalogId={tool.catalogId} contents={contents} focused={focused} />
        );
      }
      if (tool.definition?.container) {
        return centered(<VesselArt size={square} tool={tool} contents={contents} focused={focused} appearance={appearance} />);
      }
      return centered(<GadgetArt size={square} name={tool.name} appearance={appearance} focused={focused} />);
    }
  }
}

type Box = { width: number; height: number };

const POT_APPEARANCE: ToolAppearance = { shape: "circle", color: "#5b5f66", icon: "soup-kitchen" };

// 上から見た包丁。斜めに置く。
export function KnifeArt({ size }: { size: number }) {
  const length = size * 1.15;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View style={{ transform: [{ rotate: "-40deg" }], alignItems: "center" }}>
        <View style={[styles.knifeBlade, { width: size * 0.2, height: length * 0.62 }]} />
        <View style={[styles.knifeBolster, { width: size * 0.22 }]} />
        <View style={[styles.knifeHandle, { width: size * 0.17, height: length * 0.34 }]} />
      </View>
      <Text style={styles.toolLabel}>包丁</Text>
    </View>
  );
}

// 写真の包丁。縦に置く
function ImageKnifeArt({ box, name, catalogId }: { box: Box; name: string; catalogId: ToolCatalogId }) {
  const { image: rect } = placeToolImage(catalogId, box.width, box.height, "contain");
  return (
    <View style={[styles.center, box]}>
      <Image source={getCatalogEntry(catalogId).image} style={{ width: rect.w, height: rect.h }} />
      <Text style={styles.toolLabel} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

function GlassArt({ box, catalogId }: { box: Box; catalogId: ToolCatalogId }) {
  const { image: rect } = placeToolImage(catalogId, box.width * 0.85, box.height * 0.85, "contain");
  return (
    <View style={[styles.center, box]}>
      <Image source={getCatalogEntry(catalogId).image} style={{ width: rect.w, height: rect.h }} />
      <MaterialIcons name="water-drop" size={rect.w * 0.3} color="#3d8bd9" style={styles.glassDrop} />
      <Text style={styles.toolLabel}>水</Text>
    </View>
  );
}

// 蓋。かぶせているときは器具の器の上に、器と同じ大きさで描かれる
function LidArt({ box, name, focused, covering }: { box: Box; name: string; focused?: boolean; covering: boolean }) {
  const { image } = placeToolImage("lid", box.width, box.height, "contain");
  // かぶせているときは器の大きさの枠（正方形）いっぱいに描く
  const width = covering ? box.width : image.w;
  const height = covering ? box.height : image.h;
  return (
    <View style={[styles.center, box]}>
      <Image source={getCatalogEntry("lid").image} style={{ width, height, borderRadius: width / 2 }} />
      {/* 枠線で画像が縮まないよう、上に重ねて描く */}
      {focused ? (
        <View style={[styles.focusedRing, { position: "absolute", width, height, borderRadius: width / 2 }]} />
      ) : null}
      {covering ? null : (
        <Text style={styles.toolLabel} numberOfLines={1}>
          {name}
        </Text>
      )}
    </View>
  );
}

// 写真の鍋・フライパン・ボウルなど。材料や水は画像の器の部分に重ねて描く
function ImageVesselArt({
  box,
  tool,
  catalogId,
  contents,
  focused,
}: {
  box: Box;
  tool: KitchenTool;
  catalogId: ToolCatalogId;
  contents: KitchenIngredient[];
  focused?: boolean;
}) {
  const entry = getCatalogEntry(catalogId);
  const { image: imageRect, body } = placeToolImage(catalogId, box.width, box.height, toolImageMode(tool));
  // 縁の分だけ内側を器の中とする
  const inset = Math.min(body.w, body.h) * 0.1;
  const inner = { width: body.w - inset * 2, height: body.h - inset * 2 };
  const innerSize = Math.min(inner.width, inner.height);
  const radius = entry.round ? innerSize / 2 : innerSize * 0.08;
  const waterRatio = Math.min(1, tool.waterMl / 1500);
  // 中の材料は、キッチンで1つずつ動かせるように描くときと同じ位置・大きさにする
  const slots = contentSlots(body, contents.length);
  return (
    <View style={[styles.center, box]}>
      <Image
        source={entry.image}
        style={{ position: "absolute", left: imageRect.x, top: imageRect.y, width: imageRect.w, height: imageRect.h }}
      />
      <View
        style={[
          styles.center,
          {
            position: "absolute",
            left: body.x + inset,
            top: body.y + inset,
            ...inner,
            borderRadius: radius,
            overflow: "hidden",
          },
        ]}
      >
        {tool.waterMl > 0 ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: tool.boiling ? "#7fc4ff" : "#9fd3ff", opacity: 0.35 + waterRatio * 0.4 },
            ]}
          />
        ) : null}
        {tool.boiling ? <BoilingBubbles size={innerSize} /> : null}
        {tool.heat && !tool.waterMl ? <Sizzle size={innerSize} /> : null}
      </View>
      {contents.map((item, index) => (
        <View key={item.id} style={{ position: "absolute", left: slots[index].x, top: slots[index].y }}>
          <IngredientSprite ingredient={item} size={slots[index].w} showLabel={false} />
        </View>
      ))}
      {focused ? (
        <View
          style={[
            styles.focusedRing,
            {
              position: "absolute",
              left: body.x,
              top: body.y,
              width: body.w,
              height: body.h,
              borderRadius: entry.round ? body.w / 2 : body.w * 0.08,
            },
          ]}
        />
      ) : null}
      <Text style={styles.toolLabel} numberOfLines={1}>
        {tool.name}
        {tool.waterMl > 0 ? ` 💧${tool.waterMl}ml` : ""}
      </Text>
    </View>
  );
}

function WaterArt({ size }: { size: number }) {
  const cup = size * 0.72;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View style={[styles.waterCup, { width: cup, height: cup, borderRadius: cup / 2 }]}>
        <MaterialIcons name="water-drop" size={cup * 0.5} color="#3d8bd9" />
      </View>
      <View style={[styles.waterHandle, { right: (size - cup) / 2 - 8, top: size / 2 - 6 }]} />
      <Text style={styles.toolLabel}>水</Text>
    </View>
  );
}

function shapeStyle(shape: ToolAppearance["shape"], size: number) {
  switch (shape) {
    case "circle":
      return { width: size, height: size, borderRadius: size / 2 };
    case "square":
      return { width: size, height: size, borderRadius: size * 0.16 };
    case "rect":
      return { width: size * 0.45, height: size, borderRadius: size * 0.12 };
  }
}

function isLightColor(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 170;
}

// 鍋・フライパン・ボウルなど、中に材料や水を入れられる器具。
function VesselArt({
  size,
  tool,
  contents,
  focused,
  appearance,
  withHandles,
}: {
  size: number;
  tool: KitchenTool;
  contents: KitchenIngredient[];
  focused?: boolean;
  appearance: ToolAppearance;
  withHandles?: boolean;
}) {
  const body = size * (withHandles ? 0.8 : 0.9);
  const inner = body * 0.84;
  const waterRatio = Math.min(1, tool.waterMl / 1500);
  const innerShape = shapeStyle(appearance.shape, inner);
  const itemSize = Math.max(18, inner * 0.3);
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {withHandles ? (
        <>
          <View style={[styles.potHandle, { left: 0, width: size * 0.14, top: size / 2 - 5 }]} />
          <View style={[styles.potHandle, { right: 0, width: size * 0.14, top: size / 2 - 5 }]} />
        </>
      ) : null}
      <View
        style={[
          styles.center,
          shapeStyle(appearance.shape, body),
          { backgroundColor: appearance.color },
          focused && styles.focusedRing,
        ]}
      >
        <View style={[styles.center, innerShape, { backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" }]}>
          {tool.waterMl > 0 ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: tool.boiling ? "#7fc4ff" : "#9fd3ff", opacity: 0.45 + waterRatio * 0.4 },
              ]}
            />
          ) : null}
          {tool.boiling ? <BoilingBubbles size={inner} /> : null}
          {tool.heat && !tool.waterMl ? <Sizzle size={inner} /> : null}
          <View style={styles.contents}>
            {contents.map((item) => (
              <IngredientSprite key={item.id} ingredient={item} size={itemSize} showLabel={false} />
            ))}
          </View>
          {contents.length === 0 && tool.waterMl === 0 ? (
            <MaterialIcons
              name={appearance.icon as never}
              size={inner * 0.36}
              color={isLightColor(appearance.color) ? colors.outline : "rgba(255,255,255,0.7)"}
            />
          ) : null}
        </View>
      </View>
      <Text style={styles.toolLabel} numberOfLines={1}>
        {tool.name}
        {tool.waterMl > 0 ? ` 💧${tool.waterMl}ml` : ""}
      </Text>
    </View>
  );
}

// 材料を入れられない器具（ピーラー・おろし金など）
function GadgetArt({
  size,
  name,
  appearance,
  focused,
}: {
  size: number;
  name: string;
  appearance: ToolAppearance;
  focused?: boolean;
}) {
  const body = size * 0.82;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={[
          styles.center,
          shapeStyle(appearance.shape, body),
          { backgroundColor: appearance.color },
          focused && styles.focusedRing,
        ]}
      >
        <MaterialIcons
          name={appearance.icon as never}
          size={body * 0.4}
          color={isLightColor(appearance.color) ? colors.roastedBean : colors.linenCream}
        />
      </View>
      <Text style={styles.toolLabel} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

// 器具追加シートのプレビューでも使う
export function ToolPreview({ name, appearance, container, size }: { name: string; appearance: ToolAppearance; container: boolean; size: number }) {
  const tool: KitchenTool = {
    id: "preview",
    kind: "custom",
    name: name || "新しい器具",
    location: { area: "rack" },
    waterMl: 0,
    heat: null,
    boiling: false,
    definition: { id: "preview", name, actions: [], appearance, container, heatable: false },
  };
  return <ToolSprite tool={tool} size={size} />;
}

function Bubble({ size, index }: { size: number; index: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withDelay(
        index * 180,
        withRepeat(withTiming(1, { duration: 900 + (index % 3) * 200, easing: Easing.out(Easing.quad) }), -1, false)
      )
    );
  }, [index, progress]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.get(),
    transform: [{ scale: 0.3 + progress.get() }],
  }));
  const angle = (index / 7) * Math.PI * 2;
  const radius = size * (0.15 + (index % 3) * 0.1);
  const bubble = size * 0.12;
  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: bubble,
          height: bubble,
          borderRadius: bubble / 2,
          left: size / 2 + Math.cos(angle) * radius - bubble / 2,
          top: size / 2 + Math.sin(angle) * radius - bubble / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function BoilingBubbles({ size }: { size: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {Array.from({ length: 7 }, (_, index) => (
        <Bubble key={index} size={size} index={index} />
      ))}
    </View>
  );
}

// 水がない状態で加熱しているとき（炒める・焼く）の揺らぎ
function Sizzle({ size }: { size: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 300 })), -1));
  }, [progress]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: 0.15 + progress.get() * 0.25 }));
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { pointerEvents: "none", backgroundColor: "#ffb347", borderRadius: size / 2 }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: {
    position: "absolute",
    bottom: -12,
    maxWidth: 110,
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: "hidden",
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurface,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  knifeBlade: {
    backgroundColor: "#d9dde3",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: "#aab1ba",
  },
  knifeBolster: {
    height: 4,
    backgroundColor: "#8d949c",
  },
  knifeHandle: {
    backgroundColor: "#3E2723",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  glassDrop: {
    position: "absolute",
  },
  waterCup: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(160, 210, 255, 0.55)",
    borderWidth: 2,
    borderColor: "#7fb7e8",
  },
  waterHandle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: "#7fb7e8",
  },
  potHandle: {
    position: "absolute",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2f3236",
  },
  contents: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  bubble: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
  },
  focusedRing: {
    borderWidth: 3,
    borderColor: "#ffb300",
  },
});

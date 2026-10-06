import { useEffect, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { colors } from "../../theme";
import { getCutStyle, type CutStyle } from "../../lib/kitchen/constants";
import type { CutResult, IngredientImage, KitchenIngredient } from "../../lib/kitchen/types";

type ArtProps = { image: IngredientImage | null; name: string; size: number };

// 材料そのものの絵。透過済みならそのまま、透過されていない写真は丸く切り抜いて「シール」風にする。
export function IngredientArt({ image, name, size }: ArtProps) {
  if (image?.uri) {
    if (image.transparent) {
      return <Image source={{ uri: image.uri }} style={{ width: size, height: size }} contentFit="contain" />;
    }
    return (
      <View style={[styles.sticker, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={{ uri: image.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.72, lineHeight: size * 0.92 }}>{image?.emoji ?? "🥣"}</Text>
      {!image ? <Text style={styles.fallbackName}>{name.slice(0, 2)}</Text> : null}
    </View>
  );
}

type Piece = { x: number; y: number; w: number; h: number; dx: number; dy: number; rotate: number };

// 疑似乱数（同じ材料なら毎回同じ散らばり方にする）
function seeded(seed: number) {
  let value = seed % 2147483647 || 1;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function hash(text: string) {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) value = (value * 31 + text.charCodeAt(index)) | 0;
  return Math.abs(value) + 1;
}

function buildPieces(style: CutStyle["pieces"], size: number, widthCm: number | undefined, seed: number): Piece[] {
  const random = seeded(seed);
  const pieces: Piece[] = [];
  const grid = (columns: number, rows: number, spread: number, maxRotate: number) => {
    const w = size / columns;
    const h = size / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        pieces.push({
          x: column * w,
          y: row * h,
          w,
          h,
          dx: (column - (columns - 1) / 2) * spread + (random() - 0.5) * spread,
          dy: (row - (rows - 1) / 2) * spread + (random() - 0.5) * spread,
          rotate: (random() - 0.5) * maxRotate,
        });
      }
    }
  };
  switch (style) {
    case "strips":
      grid(9, 1, 2.4, 14);
      break;
    case "slices": {
      // 「◯cmずつ」は幅が広いほど枚数が少なくなる。
      const count = widthCm ? Math.max(2, Math.min(8, Math.round(6 / widthCm))) : 5;
      grid(count, 1, 5, 8);
      break;
    }
    case "chunks":
      grid(3, 3, 7, 50);
      break;
    case "mince":
      grid(6, 6, 3.5, 90);
      break;
    case "wedges":
      grid(3, 2, 7, 30);
      break;
  }
  return pieces;
}

function PieceView({ piece, progress, children, size }: { piece: Piece; progress: SharedValue<number>; children: ReactNode; size: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.dx * progress.get() },
      { translateY: piece.dy * progress.get() },
      { rotate: `${piece.rotate * progress.get()}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[{ position: "absolute", left: piece.x, top: piece.y, width: piece.w, height: piece.h, overflow: "hidden" }, animatedStyle]}
    >
      <View style={{ position: "absolute", left: -piece.x, top: -piece.y, width: size, height: size }}>{children}</View>
    </Animated.View>
  );
}

// 切った材料。元の絵を細かく切り分けて少しずつ散らす。
export function CutPieces({ cut, size, seedKey, children }: { cut: CutResult; size: number; seedKey: string; children: ReactNode }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(0);
    progress.set(withTiming(1, { duration: 450 }));
  }, [cut, progress]);
  const pieces = buildPieces(getCutStyle(cut.style).pieces, size, cut.widthCm, hash(seedKey + cut.style));
  return (
    <View style={{ width: size, height: size }}>
      {pieces.map((piece, index) => (
        <PieceView key={index} piece={piece} progress={progress} size={size}>
          {children}
        </PieceView>
      ))}
    </View>
  );
}

type SpriteProps = {
  ingredient: KitchenIngredient;
  size: number;
  focused?: boolean;
  showLabel?: boolean;
};

export function IngredientSprite({ ingredient, size, focused, showLabel = true }: SpriteProps) {
  const art = <IngredientArt image={ingredient.image} name={ingredient.name} size={size} />;
  return (
    // 画像がタッチを奪うと（Web では画像のドラッグが始まってしまう）ドラッグできないので、絵は操作対象から外す。
    <View style={{ width: size, height: size, alignItems: "center" }} pointerEvents="none">
      <View style={[focused && styles.focused, focused && { borderRadius: size / 2 }]}>
        {ingredient.cut ? (
          <CutPieces cut={ingredient.cut} size={size} seedKey={ingredient.id}>
            {art}
          </CutPieces>
        ) : (
          art
        )}
      </View>
      {showLabel ? (
        <Text style={styles.label} numberOfLines={1}>
          {ingredient.name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sticker: {
    overflow: "hidden",
    borderWidth: 3,
    borderColor: colors.surfaceContainerLowest,
    backgroundColor: colors.surfaceContainerLowest,
  },
  fallbackName: {
    position: "absolute",
    bottom: 2,
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
  },
  focused: {
    shadowColor: "#ffb300",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 2,
    borderColor: "#ffb300",
  },
  label: {
    position: "absolute",
    bottom: -14,
    maxWidth: 72,
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: "hidden",
    fontSize: 10,
    fontWeight: "600",
    color: colors.onSurface,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});

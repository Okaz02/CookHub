import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { getHeatLevel } from "../../lib/kitchen/constants";
import type { Circle, KitchenLayout, Rect } from "../../lib/kitchen/layout";
import type { ActiveHeat } from "../../lib/kitchen/types";

type Props = {
  layout: KitchenLayout;
  // バーナーごとの火の状態（null は消火）
  burnerHeat: (ActiveHeat | null)[];
  // ドラッグ中の物を置けそうな場所を強調する
  highlight: { board?: boolean; shelf?: boolean; burners?: boolean[] };
  onPressKnob: (burner: number) => void;
};

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
  const ratio = { low: 0.55, mediumLow: 0.68, medium: 0.8, high: 0.98 }[heat.level];
  const radius = burner.r * ratio;
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.get() * 0.45,
    transform: [{ scale: 0.96 + pulse.get() * 0.06 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flame,
        {
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

export function KitchenBackground({ layout, burnerHeat, highlight, onPressKnob }: Props) {
  const { shelf, board, rack, stove, burners } = layout;
  return (
    <>
      <View style={[rectStyle(shelf), styles.shelf, highlight.shelf && styles.highlight]}>
        <ZoneLabel icon="kitchen" text="棚（材料）" />
        {Array.from({ length: Math.max(1, Math.round(shelf.h / 64)) }, (_, index) => (
          <View key={index} style={[styles.shelfPlank, { top: 22 + (index + 1) * 64 - 8 }]} />
        ))}
      </View>

      <View style={[rectStyle(board), styles.board, highlight.board && styles.highlight]}>
        <ZoneLabel icon="content-cut" text="まな板" />
        <View style={styles.boardGrain} />
        <View style={styles.boardHole} />
      </View>

      <View style={[rectStyle(rack), styles.rack]}>
        <ZoneLabel icon="countertops" text="調理台" light />
      </View>

      <View style={[rectStyle(stove), styles.stove]}>
        <ZoneLabel icon="local-fire-department" text="コンロ" light />
      </View>

      {burners.map((burner, index) => {
        const heat = burnerHeat[index];
        return (
          <View key={`burner-${index}`}>
            <View
              style={[
                styles.burner,
                {
                  left: burner.cx - burner.r,
                  top: burner.cy - burner.r,
                  width: burner.r * 2,
                  height: burner.r * 2,
                  borderRadius: burner.r,
                },
                highlight.burners?.[index] && styles.highlight,
              ]}
            >
              <View style={[styles.grate, { width: burner.r * 2, height: 3 }]} />
              <View style={[styles.grate, { width: 3, height: burner.r * 2 }]} />
              <View
                style={[
                  styles.burnerCap,
                  { width: burner.r * 0.6, height: burner.r * 0.6, borderRadius: burner.r * 0.3 },
                ]}
              />
            </View>
            {heat ? <Flame burner={burner} heat={heat} /> : null}
            <Pressable
              style={[
                styles.knob,
                { left: burner.cx - 46, top: burner.cy + burner.r + 6 },
                heat && { backgroundColor: getHeatLevel(heat.level).color },
              ]}
              onPress={() => onPressKnob(index)}
              hitSlop={6}
            >
              <MaterialIcons name="whatshot" size={14} color="#fff" />
              <Text style={styles.knobText}>
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
  shelf: {
    borderRadius: 10,
    backgroundColor: "#d7b48c",
    borderWidth: 2,
    borderColor: "#a47a52",
    overflow: "hidden",
  },
  shelfPlank: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#a47a52",
    opacity: 0.6,
  },
  board: {
    borderRadius: 14,
    backgroundColor: "#f1d9b5",
    borderWidth: 2,
    borderColor: "#d1ae7d",
    overflow: "hidden",
  },
  boardGrain: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "55%",
    height: 1,
    backgroundColor: "#d9bb8f",
  },
  boardHole: {
    position: "absolute",
    right: 10,
    top: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#d1ae7d",
  },
  rack: {
    borderRadius: 10,
    backgroundColor: "#8f969c",
    borderWidth: 2,
    borderColor: "#6f767c",
  },
  stove: {
    borderRadius: 14,
    backgroundColor: "#2b2d30",
    borderWidth: 2,
    borderColor: "#17181a",
  },
  burner: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3a3d41",
    borderWidth: 3,
    borderColor: "#55595e",
  },
  grate: {
    position: "absolute",
    backgroundColor: "#1d1e20",
  },
  burnerCap: {
    backgroundColor: "#1d1e20",
    borderWidth: 2,
    borderColor: "#606469",
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
    width: 92,
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

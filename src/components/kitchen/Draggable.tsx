import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { rectCenter, type Point, type Rect } from "../../lib/kitchen/layout";

type Props = {
  // 親の中での位置。キャンバスに直接置くときはキャンバス座標
  rect: Rect;
  // スクロールする枠の中に置くとき、親の左上がいまキャンバス上のどこにあるか（スクロール量を引いた位置）
  origin?: () => Point;
  // スクロールする枠の中に置くとき、その枠がスクロールする向き。
  // スクロールと同じ向きに動かすとスクロール、違う向きに動かすとすぐドラッグ。長押ししてからならどの向きでもドラッグ
  scrollAxis?: "x" | "y";
  // スクロールする枠の中では枠の外に出ると見えなくなるので、ドラッグ中は自分を隠し、
  // 動いた量をここに書き込む（キャンバスの一番上に描いた持ち上げ中の絵がこれを使って動く）
  lift?: { x: SharedValue<number>; y: SharedValue<number> };
  enabled?: boolean;
  // ドロップ位置（キャンバス座標の中心点）を受け取り、置き場所が変わるなら true を返す。
  onDrop: (center: Point) => boolean;
  onTap?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  children: ReactNode;
};

// 却下されたときに元の場所へ戻る速さ（はね返らないよう、ばねではなく一定の速さで戻す）
const RETURN = { duration: 150 };
// 置き場所が変わるはずなのに位置が変わらなかった（操作が却下された）ときに元へ戻すまでの猶予。
const SETTLE_TIMEOUT_MS = 250;
const LONG_PRESS_MS = 400;
// この距離を動いた向きで、スクロールかドラッグかを決める
const AXIS_SLOP = 10;

type PanGesture = ReturnType<typeof Gesture.Pan>;

export function Draggable({
  rect,
  origin,
  scrollAxis,
  lift,
  enabled = true,
  onDrop,
  onTap,
  onDragStart,
  onDragEnd,
  children,
}: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const [isDragging, setIsDragging] = useState(false);
  // ジェスチャーのコールバックから参照するので state ではなく ref で持つ
  const activeRef = useRef(false);
  const rectRef = useRef(rect);

  // 置き場所が変わったら、動かした分を消して新しい位置にそのまま置く（移動のアニメーションはしない）
  useLayoutEffect(() => {
    const previous = rectRef.current;
    rectRef.current = rect;
    if (previous.x === rect.x && previous.y === rect.y) return;
    translateX.set(0);
    translateY.set(0);
  }, [rect, translateX, translateY]);

  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const springBack = () => {
    translateX.set(withTiming(0, RETURN));
    translateY.set(withTiming(0, RETURN));
  };

  const withHandlers = (gesture: PanGesture) =>
    gesture
      .runOnJS(true)
      .enabled(enabled)
      .onStart(() => {
        lift?.x.set(0);
        lift?.y.set(0);
        activeRef.current = true;
        setIsDragging(true);
        scale.set(1.12);
        onDragStart?.();
      })
      .onUpdate((event) => {
        if (lift) {
          lift.x.set(event.translationX);
          lift.y.set(event.translationY);
          return;
        }
        translateX.set(event.translationX);
        translateY.set(event.translationY);
      })
      .onEnd((event) => {
        const offset = origin?.() ?? { x: 0, y: 0 };
        const local = rectCenter(rectRef.current);
        const center = { x: local.x + offset.x, y: local.y + offset.y };
        const droppedRect = rectRef.current;
        const moved = onDrop({ x: center.x + event.translationX, y: center.y + event.translationY });
        if (!moved) {
          springBack();
          return;
        }
        if (settleTimer.current) clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => {
          // レイアウトは毎回計算し直されるので、オブジェクトではなく座標で比較する。
          if (rectRef.current.x === droppedRect.x && rectRef.current.y === droppedRect.y) springBack();
        }, SETTLE_TIMEOUT_MS);
      })
      .onFinalize(() => {
        // タップだけで終わった場合（パンが始まっていない）は何もしない
        if (!activeRef.current) return;
        activeRef.current = false;
        setIsDragging(false);
        onDragEnd?.();
        scale.set(1);
      });

  const pan = !scrollAxis
    ? withHandlers(Gesture.Pan().minDistance(4))
    : Gesture.Race(
        // スクロールと違う向きに動かしたらすぐドラッグ（同じ向きならこのジェスチャーは失敗して、枠がスクロールする）
        withHandlers(
          scrollAxis === "x"
            ? Gesture.Pan().activeOffsetY([-AXIS_SLOP, AXIS_SLOP]).failOffsetX([-AXIS_SLOP, AXIS_SLOP])
            : Gesture.Pan().activeOffsetX([-AXIS_SLOP, AXIS_SLOP]).failOffsetY([-AXIS_SLOP, AXIS_SLOP])
        ),
        // 長押ししてからなら、どの向きでもドラッグ
        withHandlers(Gesture.Pan().activateAfterLongPress(LONG_PRESS_MS))
      );

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((_event, success) => {
      if (success) onTap?.();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }, { scale: scale.get() }],
  }));

  return (
    // Web では、スクロールの向きの指の動きはブラウザに任せる（そうしないとスクロールできない）
    <GestureDetector
      gesture={Gesture.Exclusive(pan, tap)}
      touchAction={scrollAxis ? (scrollAxis === "x" ? "pan-x" : "pan-y") : undefined}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            zIndex: isDragging ? 1000 : 10,
            elevation: isDragging ? 12 : 0,
            opacity: isDragging && lift ? 0 : 1,
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

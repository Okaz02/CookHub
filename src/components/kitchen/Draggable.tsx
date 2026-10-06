import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { rectCenter, type Point, type Rect } from "../../lib/kitchen/layout";

type Props = {
  rect: Rect;
  enabled?: boolean;
  // ドロップ位置（キャンバス座標の中心点）を受け取り、置き場所が変わるなら true を返す。
  onDrop: (center: Point) => boolean;
  onTap?: () => void;
  onDragStart?: () => void;
  children: ReactNode;
};

const SPRING = { damping: 18, stiffness: 180 };
// 置き場所が変わるはずなのに位置が変わらなかった（操作が却下された）ときに元へ戻すまでの猶予。
const SETTLE_TIMEOUT_MS = 250;

export function Draggable({ rect, enabled = true, onDrop, onTap, onDragStart, children }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const [isDragging, setIsDragging] = useState(false);
  const rectRef = useRef(rect);
  const previousRect = useRef(rect);

  // 置き場所が変わったら、ドロップした位置から新しい位置まで滑らかに移動させる。
  useLayoutEffect(() => {
    const previous = previousRect.current;
    previousRect.current = rect;
    rectRef.current = rect;
    if (previous.x === rect.x && previous.y === rect.y) return;
    translateX.set(translateX.get() + (previous.x - rect.x));
    translateY.set(translateY.get() + (previous.y - rect.y));
    translateX.set(withSpring(0, SPRING));
    translateY.set(withSpring(0, SPRING));
  }, [rect, translateX, translateY]);

  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const springBack = () => {
    translateX.set(withSpring(0, SPRING));
    translateY.set(withSpring(0, SPRING));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(enabled)
    .minDistance(4)
    .onStart(() => {
      setIsDragging(true);
      scale.set(withSpring(1.12, SPRING));
      onDragStart?.();
    })
    .onUpdate((event) => {
      translateX.set(event.translationX);
      translateY.set(event.translationY);
    })
    .onEnd((event) => {
      const center = rectCenter(rectRef.current);
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
      setIsDragging(false);
      scale.set(withSpring(1, SPRING));
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((_event, success) => {
      if (success) onTap?.();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }, { scale: scale.get() }],
  }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
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
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

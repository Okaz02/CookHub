import { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageRequireSource,
  type LayoutChangeEvent,
  type ViewProps,
} from 'react-native';
import { getImageSize } from './imageSize';

// 元画像を区切る幅（画像の幅・高さに対する %）。stretch: true の区間だけが伸び縮みする
export type Segment = { percent: number; stretch: boolean };

type Props = ViewProps & {
  source: ImageRequireSource; // require('./xxx.png') の形で渡す
  cols: Segment[]; // 左から順に。合計 100 になるように
  rows: Segment[]; // 上から順に。合計 100 になるように
  scale: number; // 元画像の何ピクセルを 1dp とするか（固定区間の表示サイズが決まる）
};

// 各区間の「元画像での開始位置」と「表示サイズ(dp)」を求める
function layout(percents: Segment[], imageSize: number, total: number, scale: number) {
  const segments = percents.map((s) => ({ px: (s.percent / 100) * imageSize, stretch: s.stretch }));
  const fixedDp = segments.filter((s) => !s.stretch).reduce((sum, s) => sum + s.px / scale, 0);
  const stretchPx = segments.filter((s) => s.stretch).reduce((sum, s) => sum + s.px, 0);
  let src = 0;
  return segments.map((s) => {
    const dp = s.stretch ? ((total - fixedDp) * s.px) / stretchPx : s.px / scale;
    const out = { src, px: s.px, dp };
    src += s.px;
    return out;
  });
}

// View と同じように使える。大きさは style やレイアウトで決まり、画像はその大きさに合わせて背景に敷かれる
export function SlicedImage({ source, cols, rows, scale, onLayout, children, ...viewProps }: Props) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
    onLayout?.(e);
  };

  const { width: sourceW, height: sourceH } = getImageSize(source);
  // 大きさが分かるまで（最初の onLayout まで）は背景を描かない
  const colLayout = size ? layout(cols, sourceW, size.width, scale) : [];
  const rowLayout = size ? layout(rows, sourceH, size.height, scale) : [];

  return (
    <View {...viewProps} onLayout={handleLayout}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {rowLayout.map((r) => (
          <View key={r.src} style={{ flexDirection: 'row', height: r.dp }}>
            {colLayout.map((c) => (
              <View key={c.src} style={{ width: c.dp, height: r.dp, overflow: 'hidden' }}>
                <Image
                  source={source}
                  resizeMode="stretch"
                  style={{
                    position: 'absolute',
                    width: (sourceW * c.dp) / c.px,
                    height: (sourceH * r.dp) / r.px,
                    left: (-c.src * c.dp) / c.px,
                    top: (-r.src * r.dp) / r.px,
                  }}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
      {children}
    </View>
  );
}

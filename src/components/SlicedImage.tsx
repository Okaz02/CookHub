import { Asset } from 'expo-asset';
import { useState } from 'react';
import { Image, StyleSheet, View, type ImageRequireSource, type LayoutChangeEvent, type ViewProps } from 'react-native';

export type Segment = { percent: number; stretch: boolean };

type Props = ViewProps & {
  source: ImageRequireSource;
  cols: Segment[];
  rows: Segment[];
  scale: number;
}

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


export function SlicedImage({ source, cols, rows, scale, onLayout, children, ...viewProps }: Props) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
    onLayout?.(e);
  };

  const asset = Asset.fromModule(source);
  const sourceW = asset.width!;
  const sourceH = asset.height!;
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
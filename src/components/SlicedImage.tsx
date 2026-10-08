import { Image, View, type ImageRequireSource } from 'react-native';


export type Segment = { percent: number; stretch: boolean };

type Props = {
  source: ImageRequireSource;
  cols: Segment[];
  rows: Segment[];
  width: number;
  height: number;
  scale: number;
};

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

export function SlicedImage({ source, cols, rows, width, height, scale }: Props) {
  const asset = Image.resolveAssetSource(source)!;
  const sourceW = asset.width!;
  const sourceH = asset.height!;
  const colLayout = layout(cols, sourceW, width, scale);
  const rowLayout = layout(rows, sourceH, height, scale);
  return (
    <View style={{ width, height }}>
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
  );
}

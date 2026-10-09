import { Children, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

// 2個までは1段。3個以上は上に多め（切り上げ）、下に残りの2段
function splitRows(items: ReactNode[]) {
  if (items.length <= 2) return [items];
  const top = Math.ceil(items.length / 2);
  return [items.slice(0, top), items.slice(top)];
}

// 囲った子要素を並べる。段は上下に、各段の中は左右に等間隔（space-evenly）
export function BurnerLayout({ children, style, ...viewProps }: ViewProps) {
  const rows = splitRows(Children.toArray(children));
  return (
    <View {...viewProps} style={[{ justifyContent: 'space-evenly' }, style]}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
          {row}
        </View>
      ))}
    </View>
  );
}

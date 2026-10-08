import { Children, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

function splitRows(items: ReactNode[]) {
  if (items.length <= 2) return [items];
  const top = Math.ceil(items.length / 2);
  return [items.slice(0, top), items.slice(top)];
}

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

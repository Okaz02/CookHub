import { Tabs } from "expo-router";
import { colors } from "../../theme";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
      tabBarActiveTintColor: colors.roastedBean,
      tabBarInactiveTintColor: colors.outline
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "検索",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: "投稿",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <MaterialIcons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "プロフィール",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recipe"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

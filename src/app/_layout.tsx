import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "ホーム" }} />
      <Tabs.Screen name="search" options={{ title: "検索" }} />
      <Tabs.Screen name="post" options={{ title: "投稿" }} />
      <Tabs.Screen name="profile" options={{ title: "プロフィール" }} />
    </Tabs>
  );
}

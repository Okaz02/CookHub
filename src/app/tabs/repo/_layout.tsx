import { Stack } from "expo-router";
import { colors } from "../../../theme";

export default function RepoLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitle: "",
        headerShadowVisible: false,
      }}
    />
  );
}

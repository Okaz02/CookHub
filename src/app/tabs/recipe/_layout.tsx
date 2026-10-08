import { Stack } from "expo-router/stack";
import { colors } from "../../../theme";

export default function RecipeLayout() {
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

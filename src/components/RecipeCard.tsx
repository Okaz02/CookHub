import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import type { Recipe } from "../lib/api-recipe";
import { colors, textStyles } from "../theme";

type Props = {
  recipe: Recipe;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function RecipeCard({ recipe, style, children }: Props) {
  const router = useRouter();

  return (
    <Pressable style={[styles.recipe, style]} onPress={() => router.push(`/tabs/recipe/${recipe.id}`)}>
      {recipe.thumbnail ? (
        <Image style={styles.recipeImage} source={{ uri: recipe.thumbnail }} />
      ) : (
        <View style={[styles.recipeImage, styles.recipeImagePlaceholder]} />
      )}
      <View style={styles.recipeExplain}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.recipeTitle}>{recipe.title}</Text>
        <Text numberOfLines={2} ellipsizeMode="tail" style={styles.recipeDescription}>{recipe.description}</Text>
        <Text style={textStyles.text}>{recipe.owner.username}</Text>
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recipe: {
    backgroundColor: colors.primary,
    height: 350,
    overflow: "hidden",
    borderRadius: 20,
  },
  recipeImage: {
    height: 200,
  },
  recipeImagePlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  recipeTitle: {
    fontSize: 13,
    maxHeight: 26
  },
  recipeDescription: {
    fontSize: 12,
    maxHeight: 48
  },
  recipeExplain: {
    flex: 1,
    gap: 6,
    padding: 20,
    backgroundColor: colors.surfaceContainerLow,
  },
});

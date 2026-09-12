import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "./theme";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>ログイン</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="パスワード"
          placeholderTextColor={colors.outline}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Pressable style={styles.signInButton} onPress={() => router.replace("/tabs")}>
        <Text style={styles.signInButtonText}>ログイン</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
    padding: 24,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  form: {
    gap: 12,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    color: colors.onSurface,
  },
  signInButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.roastedBean,
    justifyContent: "center",
    alignItems: "center",
  },
  signInButtonText: {
    color: colors.linenCream,
    fontWeight: "700",
  },
});

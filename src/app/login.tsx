import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      setErrorMessage("ユーザー名とパスワードを入力してください。");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await signIn(username, password);
      router.replace("/tabs");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage("ユーザー名またはパスワードが違います。");
      } else {
        setErrorMessage("ログインに失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>ログイン</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="ユーザー名"
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
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

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable style={styles.submitButton} onPress={handleLogin} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.linenCream} />
        ) : (
          <Text style={styles.submitButtonText}>ログイン</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push("/sign-in")}>
        <Text style={styles.linkText}>アカウントをお持ちでない方はこちら</Text>
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
  errorText: {
    color: colors.error,
    textAlign: "center",
  },
  submitButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.roastedBean,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: colors.linenCream,
    fontWeight: "700",
  },
  linkText: {
    color: colors.dustyRose,
    textAlign: "center",
  },
});

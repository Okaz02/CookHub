import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { login as apiLogin, fetchSession, type Account } from "../lib/api";

const TOKEN_KEY = "cookhub_token";

type AuthContextValue = {
  account: Account | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const restoredAccount = await fetchSession(token);
        setAccount(restoredAccount);
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function signIn(username: string, password: string) {
    const { account: signedInAccount, token } = await apiLogin(username, password);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAccount(signedInAccount);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{ account, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as apiLogin, register as apiRegister, fetchSession, type Account } from "../lib/api-login";
import { getToken, setToken, deleteToken } from "../lib/tokenStorage";

type AuthContextValue = {
  account: Account | null;
  token: string | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const restoredAccount = await fetchSession(storedToken);
        setAccount(restoredAccount);
        setTokenState(storedToken);
      } catch {
        await deleteToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function signIn(username: string, password: string) {
    const { account: signedInAccount, token: newToken } = await apiLogin(username, password);
    await setToken(newToken);
    setAccount(signedInAccount);
    setTokenState(newToken);
  }

  async function signUp(username: string, email: string, password: string) {
    const { account: createdAccount, token: newToken } = await apiRegister(username, email, password);
    await setToken(newToken);
    setAccount(createdAccount);
    setTokenState(newToken);
  }

  async function signOut() {
    await deleteToken();
    setAccount(null);
    setTokenState(null);
  }

  return (
    <AuthContext.Provider value={{ account, token, isLoading, signIn, signUp, signOut }}>
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

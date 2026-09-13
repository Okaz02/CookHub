import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as apiLogin, register as apiRegister, fetchSession, type Account } from "../lib/api-login";
import { getToken, setToken, deleteToken } from "../lib/tokenStorage";

type AuthContextValue = {
  account: Account | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const restoredAccount = await fetchSession(token);
        setAccount(restoredAccount);
      } catch {
        await deleteToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function signIn(username: string, password: string) {
    const { account: signedInAccount, token } = await apiLogin(username, password);
    await setToken(token);
    setAccount(signedInAccount);
  }

  async function signUp(username: string, email: string, password: string) {
    const { account: createdAccount, token } = await apiRegister(username, email, password);
    await setToken(token);
    setAccount(createdAccount);
  }

  async function signOut() {
    await deleteToken();
    setAccount(null);
  }

  return (
    <AuthContext.Provider value={{ account, isLoading, signIn, signUp, signOut }}>
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

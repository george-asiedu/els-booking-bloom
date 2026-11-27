import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { authApi, SignupPayload } from "@/lib/api";
import { clearAppBadge } from "@/lib/appBadge";
import { mergeGuestCart } from "@/lib/api/cart";
import { tokenStore, AuthUser, ApiError } from "@/lib/apiClient";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (
    email: string,
    password: string,
    totp?: string,
  ) => Promise<{ error: Error | null; user: AuthUser | null; needsCode?: boolean }>;
  signUp: (
    payload: SignupPayload,
  ) => Promise<{ error: Error | null; user: AuthUser | null }>;
  signOut: () => void;
  /** A team member's first visit: the code goes to their email, then they choose a password. */
  startFirstVisit: (email: string) => Promise<{ error: Error | null; message?: string }>;
  finishFirstVisit: (
    email: string,
    code: string,
    password: string,
  ) => Promise<{ error: Error | null; user: AuthUser | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount.
  useEffect(() => {
    setUser(tokenStore.getUser());
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string, totp?: string) => {
    try {
      const authedUser = await authApi.login(email, password, totp);
      setUser(authedUser);
      // What they put in the basket before signing in joins their account's basket.
      if (authedUser.role !== "ADMIN") void mergeGuestCart().catch(() => undefined);
      return { error: null, user: authedUser };
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Login failed";
      // TOTP_REQUIRED: the password was right; the page asks for the code.
      const needsCode = error instanceof ApiError && error.code === "TOTP_REQUIRED";
      return { error: new Error(message), user: null, needsCode };
    }
  }, []);

  const signUp = useCallback(async (payload: SignupPayload) => {
    try {
      const authedUser = await authApi.signup(payload);
      setUser(authedUser);
      void mergeGuestCart().catch(() => undefined);
      return { error: null, user: authedUser };
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Signup failed";
      return { error: new Error(message), user: null };
    }
  }, []);

  const startFirstVisit = useCallback(async (email: string) => {
    try {
      return { error: null, message: await authApi.firstVisitCode(email) };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Couldn't send the code") };
    }
  }, []);

  const finishFirstVisit = useCallback(async (email: string, code: string, password: string) => {
    try {
      const authedUser = await authApi.firstVisitSetPassword(email, code, password);
      setUser(authedUser);
      return { error: null, user: authedUser };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Couldn't set the password"), user: null };
    }
  }, []);

  const signOut = useCallback(() => {
    clearAppBadge();
    authApi.logout();
    setUser(null);
  }, []);

  // Memoised so consumers re-render when the session changes, not on every
  // render of the provider.
  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAdmin: user?.role === "ADMIN",
      signIn,
      signUp,
      signOut,
      startFirstVisit,
      finishFirstVisit,
    }),
    [user, isLoading, signIn, signUp, signOut, startFirstVisit, finishFirstVisit],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

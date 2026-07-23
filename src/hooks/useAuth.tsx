import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authApi, SignupPayload } from "@/lib/api";
import { tokenStore, AuthUser, ApiError } from "@/lib/apiClient";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; user: AuthUser | null }>;
  signUp: (
    payload: SignupPayload,
  ) => Promise<{ error: Error | null; user: AuthUser | null }>;
  signOut: () => void;
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

  const signIn = async (email: string, password: string) => {
    try {
      const authedUser = await authApi.login(email, password);
      setUser(authedUser);
      return { error: null, user: authedUser };
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Login failed";
      return { error: new Error(message), user: null };
    }
  };

  const signUp = async (payload: SignupPayload) => {
    try {
      const authedUser = await authApi.signup(payload);
      setUser(authedUser);
      return { error: null, user: authedUser };
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Signup failed";
      return { error: new Error(message), user: null };
    }
  };

  const signOut = () => {
    authApi.logout();
    setUser(null);
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAdmin, signIn, signUp, signOut }}
    >
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

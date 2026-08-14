import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { platformApi, platformStore, PlatformUser } from "@/lib/platformApi";
import { ApiError } from "@/lib/apiClient";

interface PlatformAuthContextType {
  user: PlatformUser | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; user: PlatformUser | null }>;
  signOut: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(
  undefined,
);

export const PlatformAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the platform session from localStorage on mount.
  useEffect(() => {
    setUser(platformStore.getUser());
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const authed = await platformApi.login(email, password);
      setUser(authed);
      return { error: null, user: authed };
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Login failed";
      return { error: new Error(message), user: null };
    }
  };

  const signOut = () => {
    platformApi.logout();
    setUser(null);
  };

  return (
    <PlatformAuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const ctx = useContext(PlatformAuthContext);
  if (ctx === undefined) {
    throw new Error(
      "usePlatformAuth must be used within a PlatformAuthProvider",
    );
  }
  return ctx;
};

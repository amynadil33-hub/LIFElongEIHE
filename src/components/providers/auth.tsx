import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase.ts";

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type AuthContextValue = {
  user: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setError(sessionError ? toError(sessionError) : null);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event: string, session: { user?: SupabaseUser } | null) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setError(null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      const nextError = toError(signInError);
      setError(nextError);
      throw nextError;
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    if (signUpError) {
      const nextError = toError(signUpError);
      setError(nextError);
      throw nextError;
    }

    return Boolean(data.session);
  }, []);

  const signout = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      const nextError = toError(signOutError);
      setError(nextError);
      throw nextError;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      signInWithPassword,
      signUp,
      signout,
    }),
    [error, isLoading, signInWithPassword, signUp, signout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function useUser() {
  return useAuth().user;
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Funcionario = Database["public"]["Tables"]["funcionarios"]["Row"];
type StatusPresenca = Database["public"]["Enums"]["status_presenca"];

export interface AuthState {
  session: Session | null;
  user: User | null;
  funcionario: Funcionario | null;
  empresaId: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    nomeCompleto: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePresenca: (status: StatusPresenca) => Promise<void>;
  refreshFuncionario: () => Promise<void>;
}

// Module-level store so router beforeLoad guards can read current auth state synchronously.
export const authStore: AuthState = {
  session: null,
  user: null,
  funcionario: null,
  empresaId: null,
  isAdmin: false,
  isAuthenticated: false,
  loading: true,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const empresaId = funcionario?.empresa_id ?? null;
  const isAuthenticated = !!session;

  // Keep module-level store in sync for router guards
  useEffect(() => {
    authStore.session = session;
    authStore.user = user;
    authStore.funcionario = funcionario;
    authStore.empresaId = empresaId;
    authStore.isAdmin = isAdmin;
    authStore.isAuthenticated = isAuthenticated;
    authStore.loading = loading;
  }, [session, user, funcionario, empresaId, isAdmin, isAuthenticated, loading]);

  const loadFuncionarioData = async (userId: string) => {
    const [funcRes, roleRes] = await Promise.all([
      supabase.from("funcionarios").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setFuncionario(funcRes.data ?? null);
    const roles = roleRes.data ?? [];
    setIsAdmin(roles.some((r) => r.role === "admin"));
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Defer Supabase calls to avoid deadlocks
        setTimeout(() => {
          void loadFuncionarioData(newSession.user.id);
        }, 0);
      } else {
        setFuncionario(null);
        setIsAdmin(false);
      }
    });

    // THEN check existing session
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadFuncionarioData(data.session.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      funcionario,
      empresaId,
      isAdmin,
      isAuthenticated,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
      },
      signUp: async (email, password, nomeCompleto) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { nome_completo: nomeCompleto },
          },
        });
        return { error };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error };
      },
      updatePresenca: async (status) => {
        if (!user) return;
        const { data } = await supabase
          .from("funcionarios")
          .update({ status_presenca: status, ultimo_acesso: new Date().toISOString() })
          .eq("id", user.id)
          .select()
          .maybeSingle();
        if (data) setFuncionario(data);
      },
      refreshFuncionario: async () => {
        if (user) await loadFuncionarioData(user.id);
      },
    }),
    [session, user, funcionario, empresaId, isAdmin, isAuthenticated, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
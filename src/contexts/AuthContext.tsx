import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { api, type MeResponse } from "../lib/api";
import { authService } from "../services/authService";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  me: MeResponse | null;
  loading: boolean;

  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, fullName?: string): Promise<void>;
  logout(): Promise<void>;
  updateProfile(fullName: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
};

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<User | null>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    authService.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setMe(null);
      return;
    }

    let cancelled = false;
    api
      .me()
      .then((result) => {
        if (!cancelled) setMe(result);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  async function login(
    email: string,
    password: string
  ) {
    const { error } = await authService.signIn(
      email,
      password
    );

    if (error) throw error;
  }

  async function register(
    email: string,
    password: string,
    fullName?: string
  ) {
    const { error } = await authService.signUp(
      email,
      password,
      fullName
    );

    if (error) throw error;
  }

  async function logout() {
    const { error } = await authService.signOut();
    if (error) throw error;
  }

  async function updateProfile(fullName: string) {
    const { error } = await authService.updateProfile(fullName);
    if (error) throw error;
  }

  async function updatePassword(password: string) {
    const { error } = await authService.updatePassword(password);
    if (error) throw error;
  }

  async function resetPassword(email: string) {
    const { error } = await authService.resetPassword(email);
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        me,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

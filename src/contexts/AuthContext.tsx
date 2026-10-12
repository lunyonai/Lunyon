import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { api, type MeResponse } from "../lib/api";
import { markOAuthPending, oauthRedirectTo } from "../lib/oauthRedirect";
import { authService } from "../services/authService";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  me: MeResponse | null;
  loading: boolean;
  recovering: boolean;

  login(email: string, password: string): Promise<void>;
  loginWithGoogle(): Promise<void>;
  register(email: string, password: string, fullName?: string): Promise<void>;
  logout(): Promise<void>;
  updateProfile(fullName: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  resetPassword(email: string, redirectTo?: string): Promise<void>;
  verifyRecoveryOtp(email: string, token: string): Promise<void>;
  completeRecovery(): Promise<void>;
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
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let settled = false;
    const settle = (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    const fallback = window.setTimeout(() => {
      void authService.getSession().then(({ data }) => {
        settle(data.session);
      });
    }, 2500);

    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecovering(true);
      }
      if (event === "SIGNED_OUT") {
        setRecovering(false);
      }
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        window.clearTimeout(fallback);
        settle(nextSession);
        return;
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      window.clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (recovering || !session?.access_token) {
      if (!session?.access_token) setMe(null);
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
    const { data, error } = await authService.signIn(
      email,
      password
    );

    if (error) throw error;
    if (!data.session?.user) {
      throw new Error("NO_SESSION");
    }

    setSession(data.session);
    setUser(data.session.user);
  }

  async function loginWithGoogle() {
    markOAuthPending();
    const { error } = await authService.signInWithGoogle(oauthRedirectTo());
    if (error) throw error;
  }

  async function register(
    email: string,
    password: string,
    fullName?: string
  ) {
    const { data, error } = await authService.signUp(
      email,
      password,
      fullName
    );

    if (error) throw error;
    if (!data.session?.user) {
      throw new Error("NO_SESSION");
    }

    setSession(data.session);
    setUser(data.session.user);
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

  async function resetPassword(email: string, redirectTo?: string) {
    const target =
      redirectTo ?? `${window.location.origin}/reset-password`;
    const { error } = await authService.resetPassword(email, target);
    if (error) throw error;
  }

  async function verifyRecoveryOtp(email: string, token: string) {
    const { data, error } = await authService.verifyRecoveryOtp(email, token);
    if (error) throw error;
    if (!data.session?.user) {
      throw new Error("NO_SESSION");
    }
    setRecovering(true);
    setSession(data.session);
    setUser(data.session.user);
  }

  async function completeRecovery() {
    await authService.signOut();
    setRecovering(false);
    setSession(null);
    setUser(null);
    setMe(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        me,
        loading,
        recovering,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        updatePassword,
        resetPassword,
        verifyRecoveryOtp,
        completeRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

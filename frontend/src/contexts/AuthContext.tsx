import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { authService } from "../services/authService";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;

  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
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

  useEffect(() => {
    authService.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (_event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
});

    return () => subscription.unsubscribe();
  }, []);

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
    password: string
  ) {
    const { error } = await authService.signUp(
      email,
      password
    );

    if (error) throw error;
  }

  async function logout() {
    await authService.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

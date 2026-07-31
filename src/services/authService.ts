import { supabase } from "../lib/supabase";
import type {
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";

export const authService = {
  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signUp(email: string, password: string) {
    return supabase.auth.signUp({
      email,
      password,
    });
  },

  signOut() {
    return supabase.auth.signOut();
  },

  getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(
    callback: (
      event: AuthChangeEvent,
      session: Session | null
    ) => Promise<void>
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
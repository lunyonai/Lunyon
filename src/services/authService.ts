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

  signUp(email: string, password: string, fullName?: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: fullName
        ? {
            data: { full_name: fullName },
          }
        : undefined,
    });
  },

  signOut() {
    return supabase.auth.signOut();
  },

  updateProfile(fullName: string) {
    return supabase.auth.updateUser({
      data: { full_name: fullName },
    });
  },

  updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },

  resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email);
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
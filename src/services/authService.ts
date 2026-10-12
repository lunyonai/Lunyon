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

  signInWithGoogle(redirectTo: string) {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });
  },

  updateProfile(fullName: string) {
    return supabase.auth.updateUser({
      data: { full_name: fullName },
    });
  },

  updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },

  resetPassword(email: string, redirectTo: string) {
    return supabase.auth.resetPasswordForEmail(email, { redirectTo });
  },

  verifyRecoveryOtp(email: string, token: string) {
    return supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });
  },

  getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(
    callback: (
      event: AuthChangeEvent,
      session: Session | null
    ) => void | Promise<void>
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
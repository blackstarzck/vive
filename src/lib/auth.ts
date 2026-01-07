import { createServerSupabaseClient } from "@/lib/supabase-server";
import { User } from "@supabase/supabase-js";

export interface AuthSession {
  user: User | null;
}

// Get the current session from Supabase Auth
export async function auth(): Promise<AuthSession> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user };
}

// Sign out the current user
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}

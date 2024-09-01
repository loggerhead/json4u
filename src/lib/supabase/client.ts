import { env } from "@/lib/env";
import { createBrowserClient } from "@supabase/ssr";

// https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app
// On the client, createBrowserClient already uses a singleton pattern,
// so you only ever create one instance, no matter how many times you call your createClient function.
export function createClient() {
  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const supabase = createClient();

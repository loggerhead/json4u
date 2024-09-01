import { env } from "@/lib/env";
import { type MiddlewareFunctionProps } from "@rescale/nemo";
import { createServerClient } from "@supabase/ssr";

// stolen from https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app
export async function updateSession({ request, response }: MiddlewareFunctionProps) {
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return response;
}

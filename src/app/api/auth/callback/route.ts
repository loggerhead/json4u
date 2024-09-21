import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? env.NEXT_PUBLIC_APP_URL;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log("User logged in successfully", next);
      return NextResponse.redirect(next);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login-error`);
}

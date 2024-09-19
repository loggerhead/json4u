"use client";

import React, { useCallback } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Background from "@/components/Background";
import EmailLoginButton from "@/components/EmailLoginButton";
import GitHub from "@/components/icons/GitHub";
import Google from "@/components/icons/Google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Typography from "@/components/ui/typography";
import { supabase } from "@/lib/supabase/client";
import { toastErr } from "@/lib/utils";
import StoresProvider from "@/stores/StoresProvider";
import type { Provider } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function LoginPage() {
  return (
    <StoresProvider>
      <Suspense>
        <Login />
      </Suspense>
      <Background size={40} />
    </StoresProvider>
  );
}

function Login() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? `${window.location.origin}/editor`;

  return (
    <Card className="mx-auto w-[400px] h-fit">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-center">
            <Typography variant="h3">{t("login")}</Typography>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {/* TODO: allow login via google after verification */}
          {/* <OAuthButton provider="google" redirectTo={redirectTo} /> */}
          <OAuthButton provider="github" redirectTo={redirectTo} />
          <div className="my-4 flex items-center gap-2">
            <Separator className="flex-1" />
            <Typography affects="xs">{t("or")}</Typography>
            <Separator className="flex-1" />
          </div>
          <EmailLoginButton redirectTo={redirectTo} />
        </div>
      </CardContent>
      <CardFooter>
        <Typography affects="xs">
          {t.rich("before_login_statement", {
            terms: (chunks) => (
              <Link className="text-blue-500" href="/terms">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link className="text-blue-500" href="/privacy">
                {chunks}
              </Link>
            ),
          })}
        </Typography>
      </CardFooter>
    </Card>
  );
}

interface OAuthButtonProps {
  provider: Provider;
  redirectTo: string;
}

const oauthInfoMap: Partial<Record<Provider, { Icon: React.FC<{ className: string }>; text: string }>> = {
  google: {
    Icon: Google,
    text: "Google",
  },
  github: {
    Icon: GitHub,
    text: "GitHub",
  },
};

function OAuthButton({ provider, redirectTo }: OAuthButtonProps) {
  const t = useTranslations("Home");
  const { Icon, text } = oauthInfoMap[provider]!;

  const login = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      toastErr(t("login_failed", { message: error.message }));
      return;
    }
  }, []);

  return (
    <Button variant="outline" className="gap-4 py-5" onClick={() => login()}>
      <Icon className="w-5 h-5" />
      <Typography>{t("login_with", { provider: text })}</Typography>
    </Button>
  );
}

"use client";

import React from "react";
import GitHub from "@/components/icons/GitHub";
import Google from "@/components/icons/Google";
import { Button } from "@/components/ui/button";
import Typography from "@/components/ui/typography";
import { supabase } from "@/lib/supabase/client";
import { toastErr } from "@/lib/utils";
import { sendGAEvent } from "@next/third-parties/google";
import type { Provider } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import useRedirectTo from "./useRedirectTo";

interface OAuthButtonProps {
  provider: Provider;
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

export default function OAuthButton({ provider }: OAuthButtonProps) {
  const t = useTranslations("Home");
  const next = useRedirectTo();
  const { Icon, text } = oauthInfoMap[provider]!;

  return (
    <Button
      variant="outline"
      className="gap-4 py-5"
      onClick={async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${next}` },
        });

        sendGAEvent("event", "login", {
          channel: provider,
          error: error?.message ?? "succ",
        });

        if (error) {
          toastErr(t("login_failed", { message: error.message }));
          return;
        }
      }}
    >
      <Icon className="w-5 h-5" />
      <Typography>{t("login_with", { provider: text })}</Typography>
    </Button>
  );
}

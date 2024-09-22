"use client";

import { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/LoadingButton";
import { supabase } from "@/lib/supabase/client";
import { cn, toastErr, toastSucc } from "@/lib/utils";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { ButtonProps } from "./ui/button";

const LogoutButton = forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => {
  const t = useTranslations("Home");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <LoadingButton
      ref={ref}
      className={cn("justify-start text-rose-600", className)}
      loading={loading}
      onClick={async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        sendGAEvent("event", "logout", { error: error?.message ?? "succ" });
        setLoading(false);
        router.refresh();

        if (error) {
          toastErr(t("logout_failed"));
        } else {
          toastSucc(t("logout_succ"));
        }
      }}
    >
      {t("logout")}
    </LoadingButton>
  );
});
LogoutButton.displayName = "LogoutButton";

export default LogoutButton;

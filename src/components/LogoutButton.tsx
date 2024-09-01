"use client";

import { forwardRef } from "react";
import { cn, toastErr, toastSucc } from "@/lib/utils";
import { useUserStore } from "@/stores/userStore";
import { useTranslations } from "next-intl";
import { Button, ButtonProps } from "./ui/button";

const LogoutButton = forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => {
  const t = useTranslations("Home");
  const logout = useUserStore((state) => state.logout);

  return (
    <Button
      ref={ref}
      className={cn("justify-start text-rose-600", className)}
      onClick={async () => {
        const error = await logout();
        if (error) {
          toastErr(t("logout_failed"));
        } else {
          toastSucc(t("logout_succ"));
        }
      }}
    >
      {t("logout")}
    </Button>
  );
});
LogoutButton.displayName = "LogoutButton";

export default LogoutButton;

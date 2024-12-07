"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AccountPanel from "@/components/AccountPanel";
import RLinkButton from "@/components/LinkButton";
import UserAvatar from "@/components/UserAvatar";
import Typography from "@/components/ui/typography";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { CircleUserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import LinkButton from "./LinkButton";
import PopoverBtn from "./PopoverButton";

interface AccountButtonProps {
  avatarClassName: string;
  buttonClassName?: string;
  notOnSideNav?: boolean;
}

export default function AccountButton({ notOnSideNav, avatarClassName, buttonClassName }: AccountButtonProps) {
  const path = usePathname();
  const t = useTranslations("Home");
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const nameOrEmail = user?.user_metadata?.name || user?.email;
  const loginHref = {
    pathname: "/login",
    query: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}${path}`,
    },
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      await setUser(data.session?.user ?? null);
    })();

    // listen to user session change
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      await setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (user) {
    return (
      <PopoverBtn
        icon={<UserAvatar className={avatarClassName} name={nameOrEmail} url={user.user_metadata.avatar_url} />}
        title={nameOrEmail}
        notOnSideNav={notOnSideNav}
        className={buttonClassName}
        content={<AccountPanel />}
        contentClassName="p-0"
      />
    );
  } else if (notOnSideNav) {
    return (
      <RLinkButton variant="outline" className={buttonClassName} href={loginHref}>
        <Typography variant="p" className="text-primary">
          {t("login")}
        </Typography>
      </RLinkButton>
    );
  } else {
    return (
      <LinkButton
        icon={<CircleUserRound className="icon" />}
        title={t("login")}
        className={buttonClassName}
        href={loginHref}
      />
    );
  }
}

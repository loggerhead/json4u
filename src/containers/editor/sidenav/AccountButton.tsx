"use client";

import AccountPanel from "@/components/AccountPanel";
import RLinkButton from "@/components/LinkButton";
import UserAvatar from "@/components/UserAvatar";
import Typography from "@/components/ui/typography";
import { env } from "@/lib/env";
import StoresProvider from "@/stores/StoresProvider";
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

export default function AccountButton(props: AccountButtonProps) {
  // avoid create stores twice
  return props.notOnSideNav ? (
    <StoresProvider>
      <AccountBtn {...props} />
    </StoresProvider>
  ) : (
    <AccountBtn {...props} />
  );
}

function AccountBtn({ notOnSideNav, avatarClassName, buttonClassName }: AccountButtonProps) {
  const t = useTranslations("Home");
  const user = useUserStore((state) => state.user);
  const nameOrEmail = user?.user_metadata?.name || user?.email;
  const loginHref = {
    pathname: "/login",
    query: {
      redirectTo: typeof window !== "undefined" ? window.location.href : env.NEXT_PUBLIC_APP_URL,
    },
  };

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
      <RLinkButton className={buttonClassName} href={loginHref}>
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

"use client";

import { getCustomerPortalURL } from "@/app/actions";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { MessageKey } from "@/global";
import { isCN } from "@/lib/env";
import { Order } from "@/lib/supabase/table.types";
import { cn, dateToYYYYMMDD } from "@/lib/utils";
import { useUserStore } from "@/stores/userStore";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import UserAvatar from "./UserAvatar";
import Typography from "./ui/typography";

export default function AccountPanel() {
  const t = useTranslations("Pricing");
  const { user, activeOrder, getPlan } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      activeOrder: state.activeOrder,
      getPlan: state.getPlan,
    })),
  );

  if (!user) {
    return null;
  }

  const name = user.user_metadata?.name;
  const email = user.email;
  const status = activeOrder?.status;
  const plan = getPlan();

  return (
    <div className="flex flex-col text-left px-3 pt-4 pb-2">
      <div className="flex items-center gap-2 px-3 mb-3">
        <UserAvatar name={name || email} url={user.user_metadata.avatar_url} />
        {name ? (
          <div className="flex flex-col gap-1">
            <Typography>{name}</Typography>
            <Typography affects="xs">{email}</Typography>
          </div>
        ) : (
          <Typography>{email}</Typography>
        )}
      </div>
      <div className="flex flex-col mb-1 px-3 py-1 gap-1 bg-muted rounded-md">
        <span className="flex gap-1">
          <Typography affects="muted">{t("plan_display_prefix")}</Typography>
          <Typography className="font-bold">{`${t(plan as MessageKey)} (${status})`}</Typography>
        </span>
        <PremiumStatus activeOrder={activeOrder} />
      </div>
      <Button
        className={cn("justify-start", isCN && "hidden")}
        onClick={async () => {
          const url = await getCustomerPortalURL();
          url && window.open(url, "_blank");
        }}
      >
        {t("manage_plan")}
      </Button>
      <LogoutButton />
    </div>
  );
}

interface PremiumStatusProps {
  activeOrder: Order | null;
}

function PremiumStatus({ activeOrder }: PremiumStatusProps) {
  const t = useTranslations("Pricing");
  const status = activeOrder?.status;
  const renewsAt = activeOrder?.renews_at;
  const endsAt = activeOrder?.ends_at;
  const text: MessageKey = status === "active" ? "renew_display_prefix" : "expired_display_prefix";
  const date = status === "active" ? renewsAt : endsAt;

  if (!activeOrder || !date) {
    return null;
  }

  return (
    <span className="flex gap-1">
      <Typography affects="muted">{t(text)}</Typography>
      <Typography>{dateToYYYYMMDD(date)}</Typography>
    </span>
  );
}

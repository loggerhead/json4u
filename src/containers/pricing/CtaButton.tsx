"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { getCheckoutURL } from "@/app/actions";
import LoadingButton from "@/components/LoadingButton";
import { MessageKey } from "@/global";
import type { SubscriptionType } from "@/lib/shop/types";
import { cn, toastErr } from "@/lib/utils";
import { useUserStore } from "@/stores/userStore";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";

export interface PricingTier {
  plan: SubscriptionType;
  price: string;
  saveBadge?: MessageKey;
  discountPrice?: string;
  description: MessageKey;
  features: MessageKey[];
  featureEnables: boolean[];
  highlighted: boolean;
  cta: MessageKey;
}

interface CtaButtonProps {
  tier: PricingTier;
}

export function CtaButton({ tier: { plan, highlighted, cta } }: CtaButtonProps) {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const user = useUserStore((state) => state.user);

  const email = user?.email ?? "";
  const needLogin = !email;
  const needPay = plan === "monthly" || plan === "yearly";

  const onClick = async () => {
    setLoading(true);
    let action = "";

    if (needPay && !needLogin) {
      try {
        const redirectUrl = `${window.location.origin}/editor`;
        const checkoutUrl = await getCheckoutURL(plan, redirectUrl);

        if (checkoutUrl) {
          action = "open_checkout_url";
          window.LemonSqueezy.Url.Open(checkoutUrl);
        } else {
          action = "empty_checkout_url_error";
          console.error("getCheckoutURL return a empty URL:", plan, email);
          toastErr("getCheckoutURL return a empty URL");
        }
      } catch (error) {
        action = "get_checkout_url_error";
        toastErr(`getCheckoutURL failed: ${error}`);
      }
    } else if (needPay) {
      action = "login_before_pay";
      // no good way to append a hash currently: https://github.com/remix-run/react-router/issues/8393
      router.push(`/login?redirectTo=${window.location.href}`);
    } else {
      action = "goto_editor";
      router.push("/editor");
    }

    sendGAEvent("event", "cta_clicked", {
      plan,
      action,
    });
    setLoading(false);
  };

  return (
    <LoadingButton
      size="lg"
      className={cn(
        "mt-6 w-full text-black dark:text-white hover:opacity-80 transition-opacity",
        !highlighted
          ? "bg-gray-100 dark:bg-gray-600"
          : "bg-sky-300 hover:bg-sky-400 dark:bg-sky-600 dark:hover:bg-sky-700",
        needPay && "lemonsqueezy-button",
      )}
      variant={highlighted ? "default" : "outline"}
      loading={loading}
      onClick={onClick}
    >
      {t(cta)}
    </LoadingButton>
  );
}

export function CtaScript() {
  return <Script src="https://app.lemonsqueezy.com/js/lemon.js" onLoad={() => window.createLemonSqueezy()} />;
}

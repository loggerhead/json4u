"use client";

import { useState } from "react";
import Script from "next/script";
import { getCheckoutURL } from "@/app/actions";
import LoadingButton from "@/components/LoadingButton";
import Section from "@/components/Section";
import CircleCheck from "@/components/icons/CircleCheck";
import CircleX from "@/components/icons/CircleX";
import { Badge } from "@/components/ui/badge";
import Typography from "@/components/ui/typography";
import { MessageKey } from "@/global";
import { env, isCN } from "@/lib/env";
import type { SubscriptionType } from "@/lib/shop/types";
import { cn, toastErr } from "@/lib/utils";
import { useRouter } from "@/navigation";
import { UserStoreProvider, useUserStore } from "@/stores/userStore";
import { useLocale, useTranslations } from "next-intl";
import Description from "./Description.zh";
import styles from "./pricing.module.css";

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

export const tiers: PricingTier[] = [
  {
    plan: "free",
    price: "$0",
    description: "free_desc",
    features: [
      "feature_validate",
      "feature_nested_parse",
      "feature_graph_free",
      "feature_table_free",
      "feature_compare_free",
      "feature_jq_free",
      // TODO: remove comment after online
      // "feature_share_free",
      // "feature_settings_sync_free",
    ],
    featureEnables: [true, true, true, true, true, true],
    highlighted: false,
    cta: "cta_free",
  },
  {
    plan: "monthly",
    price: "$9.99",
    description: "monthly_desc",
    features: [
      "feature_validate",
      "feature_nested_parse",
      "feature_graph_premium",
      "feature_table_premium",
      "feature_compare_premium",
      "feature_jq_premium",
      // "feature_share_monthly_premium",
      // "feature_settings_sync_premium",
    ],
    featureEnables: [true, true, true, true, true, true],
    highlighted: true,
    cta: "cta_start",
  },
  {
    plan: "yearly",
    price: "$9.99",
    saveBadge: "save_40",
    discountPrice: "$6",
    description: "yearly_desc",
    features: [
      "feature_validate",
      "feature_nested_parse",
      "feature_graph_premium",
      "feature_table_premium",
      "feature_compare_premium",
      "feature_jq_premium",
      // "feature_share_yearly_premium",
      // "feature_settings_sync_premium",
    ],
    featureEnables: [true, true, true, true, true, true],
    highlighted: true,
    cta: "cta_start",
  },
];

interface PricingProps {
  hideTitle?: boolean;
  className?: string;
}

export default function Pricing({ hideTitle, className }: PricingProps) {
  const t = useTranslations("Pricing");

  return (
    <UserStoreProvider>
      <Section id="pricing" className={cn(styles.fancyOverlay, className)}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center">
          <div className={cn("w-full lg:w-auto mx-auto max-w-4xl lg:text-center", hideTitle && "hidden")}>
            <Typography variant="h2">{t("title")}</Typography>
          </div>
          {isCN() ? (
            <div className="isolate mx-auto mt-4 max-w-md gap-8 lg:mx-0 lg:max-w-none">
              <Description />
            </div>
          ) : (
            <div className="isolate mx-auto mt-4 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-white dark:bg-gray-900/80 ring-gray-300/70 dark:ring-gray-700 max-w-xs ring-1 rounded-3xl p-8 xl:p-10",
                    tier.highlighted ? styles.fancyGlassContrast : "",
                  )}
                >
                  <div className="flex items-center">
                    <h3 className="text-black dark:text-white text-2xl font-bold tracking-tight">
                      {t(tier.plan as MessageKey)}
                    </h3>
                    {tier.saveBadge && (
                      <Badge className="ml-2 h-fit text-green-900 bg-green-200">{t(tier.saveBadge)}</Badge>
                    )}
                  </div>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span
                      className={cn(
                        "text-black dark:text-white text-4xl font-bold tracking-tight",
                        tier.discountPrice ? "line-through" : "",
                      )}
                    >
                      {tier.price}
                    </span>
                    <span className="text-black dark:text-white">{tier.discountPrice}</span>
                    <span className="text-muted-foreground">{`/ ${t("unit")}`}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm leading-6">{t(tier.description)}</p>
                  <CTA tier={tier} />
                  <ul className="text-gray-700 dark:text-gray-400 mt-8 space-y-3 text-sm leading-6 xl:mt-10">
                    {tier.features.map((feature, i) => (
                      <li key={feature} className="block">
                        {tier.featureEnables[i] ? (
                          <CircleCheck className="mr-2" aria-hidden="true" />
                        ) : (
                          <CircleX className="mr-2" aria-hidden="true" />
                        )}
                        {t(feature)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" onLoad={() => window.createLemonSqueezy()} />
    </UserStoreProvider>
  );
}

interface CtaProps {
  tier: PricingTier;
}

function CTA({ tier: { plan, highlighted, cta } }: CtaProps) {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const user = useUserStore((state) => state.user);

  const email = user?.email ?? "";
  const needLogin = !email;
  const needPay = plan === "monthly" || plan === "yearly";

  const onClick = async () => {
    setLoading(true);

    if (needPay && !needLogin) {
      try {
        const redirectUrl = `${env.NEXT_PUBLIC_APP_URL}/${locale}/editor`;
        const checkoutUrl = await getCheckoutURL(plan, redirectUrl);

        if (checkoutUrl) {
          window.LemonSqueezy.Url.Open(checkoutUrl);
        } else {
          console.error("getCheckoutURL return a empty URL:", plan, email);
          toastErr("getCheckoutURL return a empty URL");
        }
      } catch (error) {
        toastErr(`getCheckoutURL failed: ${error}`);
      }
    } else if (needPay) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.href)}`);
    } else {
      router.push("/editor");
    }

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

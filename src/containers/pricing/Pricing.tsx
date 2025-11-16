import Section from "@/components/Section";
import CircleCheck from "@/components/icons/CircleCheck";
import CircleX from "@/components/icons/CircleX";
import { Badge } from "@/components/ui/badge";
import Typography from "@/components/ui/typography";
import { MessageKey } from "@/global";
import { isCN } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { PricingTier, CtaButton, CtaScript } from "./CtaButton";
import Description from "./Description.zh";
import styles from "./pricing.module.css";

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
    price: "$6.29",
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
    price: "$6.29",
    saveBadge: "save_20",
    discountPrice: "$5",
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

function PricingTemp({ hideTitle, className }: PricingProps) {
  const t = useTranslations("Pricing");

  return (
    <Section id="pricing" className={cn(styles.fancyOverlay, className)}>
      <div className="flex flex-col items-center justify-center">
        <div className={cn("w-full mx-auto max-w-4xl text-center", hideTitle && "hidden")}>
          <Typography variant="h2">{t("title")}</Typography>
        </div>
      </div>
      <div className="isolate mx-auto mt-4 max-w-md gap-8 lg:mx-0 lg:max-w-none">
        {isCN ? <Description /> : <p className="text-lg leading-8 text-muted-foreground">{t("no_pricing")}</p>}
      </div>
    </Section>
  );
}

// TODO: change to charge by usage
export default function Pricing({ hideTitle, className }: PricingProps) {
  const t = useTranslations("Pricing");

  return (
    <Section id="pricing" className={cn(styles.fancyOverlay, className)}>
      <div className="flex flex-col items-center justify-center">
        <div className={cn("w-full mx-auto max-w-4xl text-center", hideTitle && "hidden")}>
          <Typography variant="h2">{t("title")}</Typography>
        </div>
        {isCN ? (
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
                <CtaButton tier={tier} />
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
      <CtaScript />
    </Section>
  );
}

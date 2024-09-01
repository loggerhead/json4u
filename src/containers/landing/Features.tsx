"use client";

import React from "react";
import Section from "@/components/Section";
import Typography from "@/components/ui/typography";
import { Diff, Braces, ScanEye, SquareTerminal, LucideIcon, ShieldCheck, SpellCheck2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Features() {
  const t = useTranslations("Home");
  const items = [
    {
      Icon: ScanEye,
      headline: t("Visualize"),
      description: t("Visualize_description"),
    },
    {
      Icon: Diff,
      headline: t("Compare"),
      description: t("Compare_description"),
    },
    {
      Icon: SquareTerminal,
      headline: t("Command"),
      description: t("Command_description"),
    },
    {
      Icon: Braces,
      headline: t("Format"),
      description: t("Format_description"),
    },
    {
      Icon: SpellCheck2,
      headline: t("Validate"),
      description: t("Validate_description"),
    },
    {
      Icon: ShieldCheck,
      headline: t("Privacy"),
      description: t("Privacy_description"),
    },
  ];

  return (
    <Section id="features" className="gap-6">
      <Typography variant="h2" className="text-center">
        {t("features_title")}
      </Typography>
      <div className="grid grid-cols-3 gap-12">
        {items.map(({ Icon, headline, description }, i) => (
          <Feature key={i} Icon={Icon} headline={headline} description={description} />
        ))}
      </div>
    </Section>
  );
}

interface FeatureProps {
  Icon: LucideIcon;
  headline: string;
  description: string;
}

function Feature({ Icon, headline, description }: FeatureProps) {
  return (
    <div className="flex flex-col gap-6 p-4 rounded-md max-w-72 bg-muted">
      <div className="flex gap-3 items-center">
        <div className="p-2 rounded-md border">
          <Icon style={{ width: 24, height: 24 }} color="rgb(248 113 113)" />
        </div>
        <Typography variant="h3">{headline}</Typography>
      </div>
      <Typography variant="p">{description}</Typography>
    </div>
  );
}

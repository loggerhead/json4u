import React from "react";
import LinkButton from "@/components/LinkButton";
import Typography from "@/components/ui/typography";
import FAQ from "@/containers/landing/FAQ";
import Features from "@/containers/landing/Features";
import HeroCarousel from "@/containers/landing/HeroCarousel";
// import HeroTitle from "@/containers/landing/HeroTitle";
import { Pricing } from "@/containers/pricing";
import { useTranslations } from "next-intl";

// TODO: redesign
export default function Index() {
  const t = useTranslations("Home");

  return (
    <div className="relative flex flex-col items-center w-full h-full pt-12 pb-36 md:px-32 px-4 gap-24 text-center">
      {/* <HeroTitle /> */}
      <div className="flex items-center gap-12">
        <Typography variant="h3">{t("landing_title")}</Typography>
        <LinkButton className="h-[54px]" size="lg" variant="default" href="/editor">
          {/* TODO: 改为 start free */}
          <Typography variant="h5">{t("try_now")}</Typography>
        </LinkButton>
      </div>
      <HeroCarousel />
      <Features />
      <Pricing />
      <FAQ />
    </div>
  );
}

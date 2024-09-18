import React from "react";
import Background from "@/components/Background";
import LinkButton from "@/components/LinkButton";
import Section from "@/components/Section";
import Typography from "@/components/ui/typography";
import { useTranslations } from "next-intl";

export default function Title() {
  const t = useTranslations("Home");

  return (
    <Section className="gap-6 py-36">
      <Typography variant="h1" className="max-w-3xl text-center mb-6">
        {t("landing_title")}
      </Typography>
      <Typography variant="h5">{t("landing_subtitle")}</Typography>
      <div className="flex gap-4">
        <LinkButton className="h-[54px]" size="lg" variant="default" href="/editor">
          {/* TODO: 改为 start free */}
          <Typography variant="h5">{t("try_now")}</Typography>
        </LinkButton>
        <ProductHunk />
      </div>
      <Background size={40} />
    </Section>
  );
}

function ProductHunk() {
  return (
    <a
      href="https://www.producthunt.com/posts/json-for-you?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-json&#0045;for&#0045;you"
      target="_blank"
    >
      <img
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=490548&theme=light"
        alt="JSON&#0032;For&#0032;You - Fastest&#0032;JSON&#0032;visualization&#0032;and&#0032;processing&#0032;tool | Product Hunt"
        style={{ width: "250px", height: "54px" }}
        width="250"
        height="54"
      />
    </a>
  );
}

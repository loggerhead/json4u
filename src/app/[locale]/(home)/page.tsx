import React from "react";
import Image from "next/image";
import ShowWindow from "@/components/ShowWindow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Typography from "@/components/ui/typography";
import { MessageKey } from "@/global";
import { Link } from "@/navigation";
import {
  Diff,
  Braces,
  ScanEye,
  SquareTerminal,
  LucideIcon,
  ShieldCheck,
  SpellCheck2,
  CircleX,
  CircleCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function Index() {
  const t = useTranslations("Home");

  return (
    <div className="flex flex-col h-full md:py-36 md:px-32 pt-11 pb-24 px-8 md:space-y-24 w-full items-center text-center gap-12">
      <div className="flex flex-col gap-6 items-center">
        <Typography className="max-w-2xl !leading-tight" variant="h1">
          {t("landing_title")}
        </Typography>
        <Typography className="max-w-2xl" variant="h5">
          {t("landing_subtitle")}
        </Typography>
        <Link href="/editor">
          <Button size="default" variant="default">
            {t("landing_try_button")}
          </Button>
        </Link>
        <ShowWindow />
      </div>
      <Features />
      {/* <Pricing /> */}
      <Faqs />
    </div>
  );
}

function Pricing() {
  const t = useTranslations("Home");

  return (
    <div id="pricing" className="flex flex-col gap-6 items-center">
      <Typography className="max-w-2xl !leading-tight" variant="h1">
        {t("Pricing")}
      </Typography>
      <Button data-sell-store="48176" data-sell-product="238861" data-sell-theme="">
        {"Buy now"}
      </Button>
      <Link href="/editor">
        <Button size="default" variant="default">
          {t("Go to Editor")}
        </Button>
      </Link>
    </div>
  );
}

// TODO: too ugly...
function Faqs() {
  const t = useTranslations("FAQ");

  return (
    <div id="faqs" className="flex flex-col w-full gap-6 items-center">
      <Typography className="max-w-2xl !leading-tight" variant="h1">
        {t("FAQ")}
      </Typography>
      <Accordion type="multiple" className="w-full">
        <FaqItem question="q_why_build">
          <Typography>{t("a_why_build1")}</Typography>
          <Typography>{t("a_why_build2")}</Typography>
        </FaqItem>
        <FaqItem question="q_support_features">
          <Typography>
            {Array.from({ length: 14 }, (_, i) => i + 1).map((i) => (
              // @ts-ignore
              <li key={i}>{t(`a_support_features${i}`)}</li>
            ))}
          </Typography>
        </FaqItem>
        <FaqItem question="q_advantages">
          <table className="caption-bottom text-sm text-left border">
            <thead className="border-b">
              <tr>
                <th />
                <th align="center" className="px-4 py-2 border-l">
                  {"JSON For You"}
                </th>
                <th align="center" className="px-4 py-2">
                  {t("Others")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                "Graph View & Table View",
                "Structured Comparison & Text Comparison",
                "Nested Parse",
                "Validate with Error Context Display",
                "BigInt & int64 Support",
                "Convert From/To CSV",
                "Reveal via JSON Path",
                "Support jq",
              ].map((feature: MessageKey) => (
                <tr key={feature} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium border-r">{t(feature)}</td>
                  <td align="center" className="py-3">
                    <CircleCheck color="green" />
                  </td>
                  <td align="center" className="py-3">
                    <CircleX color="red" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FaqItem>
        <FaqItem question="q_what_is_jq">
          <Typography>{t("a_what_is_jq")}</Typography>
          <Typography>
            <Link
              prefetch={false}
              href="https://jqlang.github.io/jq/manual/v1.7/#basic-filters"
              target="_blank"
              className="text-blue-600 hover:text-blue-800"
            >
              {t("jq_manual")}
            </Link>
          </Typography>
          <Image
            width={1024}
            height={632}
            quality={100}
            className="mt-4"
            alt={t("jq_img_desc")}
            src="/example/jq.gif"
          />
        </FaqItem>
      </Accordion>
    </div>
  );
}

function FaqItem({ question, children }: { question: MessageKey; children: React.ReactNode }) {
  const t = useTranslations("FAQ");
  return (
    <AccordionItem value={question}>
      <AccordionTrigger>{t(question)}</AccordionTrigger>
      <AccordionContent className="text-left">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Features() {
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
    <div id="features" className="flex flex-col md:gap-36 gap-24 items-center">
      <Typography className="max-w-2xl !leading-tight" variant="h1">
        {t("features_title")}
      </Typography>
      <div className="grid grid-cols-3 gap-12">
        {items.map(({ Icon, headline, description }, i) => (
          <Feature key={i} Icon={Icon} headline={headline} description={description} />
        ))}
      </div>
    </div>
  );
}

interface FeatureProps {
  Icon: LucideIcon;
  headline: string;
  description: string;
}

function Feature({ Icon, headline, description }: FeatureProps) {
  return (
    <div className="flex flex-col gap-6 p-4 rounded-md text-left max-w-72 md:items-start items-center bg-muted">
      <div className="flex gap-3 items-center">
        <div className="p-2 rounded-md border max-w-fit">
          <Icon style={{ width: 24, height: 24 }} color="rgb(248 113 113)" />
        </div>
        <Typography variant="h3">{headline}</Typography>
      </div>
      <Typography variant="p">{description}</Typography>
    </div>
  );
}

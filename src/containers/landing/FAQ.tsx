"use client";

import React from "react";
import Image from "next/image";
import Section from "@/components/Section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Typography from "@/components/ui/typography";
import { MessageKey } from "@/global";
import { Link } from "@/navigation";
import { CircleX, CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FAQ() {
  const t = useTranslations("FAQ");

  return (
    <Section id="faq" className="gap-6">
      <Typography variant="h2">{t("FAQ")}</Typography>
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
          <Advantages />
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
    </Section>
  );
}

function Advantages() {
  const t = useTranslations("FAQ");

  return (
    <table className="caption-bottom text-sm border">
      <colgroup>
        <col />
        <col span={1} />
        <col span={1} />
      </colgroup>
      <thead className="border-b">
        <tr>
          <th className="bg-muted" />
          <th align="center" className="bg-muted p-4 border-x min-w-52">
            {"JSON For You"}
          </th>
          <th align="center" className="bg-muted p-4 min-w-52">
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
            <td className="bg-muted p-4 font-medium border-r">{t(feature)}</td>
            <td align="center" className="border-r">
              <CircleCheck color="green" />
            </td>
            <td align="center">
              <CircleX color="red" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FaqItem({ question, children }: { question: MessageKey; children: React.ReactNode }) {
  const t = useTranslations("FAQ");
  return (
    <AccordionItem value={question}>
      <AccordionTrigger>{t(question)}</AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

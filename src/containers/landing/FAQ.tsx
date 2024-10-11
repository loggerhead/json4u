import Link from "next/link";
import Section from "@/components/Section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Typography from "@/components/ui/typography";
import { MessageKey } from "@/global";
import { CircleX, CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FAQ() {
  const t = useTranslations("FAQ");

  return (
    <Section id="faq" className="gap-6">
      <Typography variant="h2" className="text-center">
        {t("FAQ")}
      </Typography>
      <Accordion type="multiple" className="w-full">
        <FaqItem question="q_why_build">
          <Typography className="text-base">{t("a_why_build1")}</Typography>
          <Typography className="text-base">{t("a_why_build2")}</Typography>
        </FaqItem>
        <FaqItem question="q_support_features">
          <Typography className="text-base">
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
          <Typography className="text-base">
            {t.rich("a_what_is_jq", {
              jq: (children) => (
                <Link
                  prefetch={false}
                  href="https://jqlang.github.io/jq/manual/v1.7/#basic-filters"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {children}
                </Link>
              ),
            })}
          </Typography>
        </FaqItem>
      </Accordion>
    </Section>
  );
}

function Advantages() {
  const t = useTranslations("FAQ");

  return (
    <table className="caption-bottom lg:text-sm border">
      <colgroup>
        <col />
        <col span={1} />
        <col span={1} />
      </colgroup>
      <thead className="border-b">
        <tr>
          <th className="bg-muted" />
          <th align="center" className="bg-muted border-x lg:min-w-36 md:min-w-32 p-2">
            {"JSON For You"}
          </th>
          <th align="center" className="bg-muted lg:min-w-36 md:min-w-32 p-2">
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
            <td className="bg-muted py-2 px-4 font-medium border-r">{t(feature)}</td>
            <td align="center" className="border-r">
              <CircleCheck className="icon" color="green" />
            </td>
            <td align="center">
              <CircleX className="icon" color="red" />
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
      <AccordionTrigger className="text-left text-base">{t(question)}</AccordionTrigger>
      <AccordionContent className="text-left text-base">{children}</AccordionContent>
    </AccordionItem>
  );
}

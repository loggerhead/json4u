import Section from "@/components/Section";
import Typography from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Features() {
  const t = useTranslations("Home");
  const items = [
    {
      headline: t("Visualize"),
      description: t("Visualize_description"),
      img: "/example/graph.webp",
    },
    {
      headline: t("Compare"),
      description: t("Compare_description"),
      img: "/example/compare.webp",
    },
    {
      headline: t("Command"),
      description: t("Command_description"),
      img: "/example/import-csv.webp",
    },
    {
      headline: t("Format"),
      description: t("Format_description"),
      img: "/example/nest-parse.webp",
    },
    {
      headline: t("Validate"),
      description: t("Validate_description"),
      img: "/example/validate.webp",
    },
  ];

  return (
    <Section id="features" className="md:!mt-4 !mt-2">
      <Typography variant="h2" className="md:mb-6">
        {t("features_title")}
      </Typography>
      <div className="mt-8 flex flex-col gap-16">
        {items.map(({ img, headline, description }, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className={cn("order-2", i % 2 ? "md:order-1" : "md:order-2")}>
              <img
                className="w-full max-w-2xl rounded-xl shadow-xl ring-1 ring-gray-400/10"
                src={img}
                alt={headline}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className={cn("order-1", i % 2 ? "md:order-2" : "md:order-1")}>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{headline}</h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">{description}</p>
            </div>
          </div>
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
    <div className="flex flex-col md:gap-6 md:p-4 p-2 gap-4 rounded-md bg-muted">
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

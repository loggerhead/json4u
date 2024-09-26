"use client";

import { useEffect, useState } from "react";
import Section from "@/components/Section";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Typography from "@/components/ui/typography";
import { useTranslations } from "next-intl";

export default function HeroCarousel() {
  const t = useTranslations("Home");
  const examples = [
    { fileName: "graph.png", desc: t("graph_img_desc") },
    { fileName: "table.png", desc: t("table_img_desc") },
    { fileName: "compare.png", desc: t("compare_img_desc") },
    { fileName: "nest-parse.png", desc: t("nest_parse_img_desc") },
    { fileName: "import-csv.png", desc: t("import_csv_img_desc") },
  ];

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <Section className="gap-6 -mt-12">
      <Carousel setApi={setApi} className="border rounded">
        <CarouselContent>
          {examples.map(({ fileName, desc }, i) => (
            <CarouselItem key={i}>
              <img width={1024} height={632} loading="lazy" decoding="async" alt={desc} src={"/example/" + fileName} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="lg:flex hidden" />
        <CarouselNext className="lg:flex hidden" />
      </Carousel>
      <Typography className="mt-2 text-muted-foreground">{examples[current].desc}</Typography>
    </Section>
  );
}

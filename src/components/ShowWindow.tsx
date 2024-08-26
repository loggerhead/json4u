"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useTranslations } from "next-intl";

export default function ShowWindow() {
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
    <>
      <Carousel
        setApi={setApi}
        className="w-full border rounded"
        plugins={[Autoplay({ delay: 2000, stopOnInteraction: true })]}
      >
        <CarouselContent>
          {examples.map(({ fileName, desc }, i) => (
            <CarouselItem key={i}>
              <Image
                width={1024}
                height={632}
                quality={100}
                priority={i === 0}
                alt={desc}
                src={"/example/" + fileName}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="py-2 text-center text-sm text-muted-foreground">{examples[current].desc}</div>
    </>
  );
}

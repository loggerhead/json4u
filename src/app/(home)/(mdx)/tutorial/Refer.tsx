"use client";

import { usePathname } from "next/navigation";
import { type Href } from "@/components/LinkButton";
import Typography from "@/components/ui/typography";
import { isCN } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Link as LinkTransition } from "next-view-transitions";

interface ReferProps {
  disableHeading?: boolean;
}

export default function Refer({ disableHeading }: ReferProps) {
  const t = useTranslations("Home");
  const currentPath = usePathname();

  const items = isCN
    ? [
        { title: "如何启用自动格式化？", href: "/tutorial/format" },
        { title: "如何使用 JSON path 过滤？", href: "/tutorial/json-path" },
        { title: "如何使用 jq？", href: "/tutorial/jq" },
        { title: "如何导入 CSV 文件？", href: "/tutorial/csv" },
      ]
    : [
        { title: "如何启用自动格式化？", href: "/tutorial/format" },
        { title: "如何使用 JSON path 过滤？", href: "/tutorial/json-path" },
        { title: "如何使用 jq？", href: "/tutorial/jq" },
        { title: "如何导入 CSV 文件？", href: "/tutorial/csv" },
      ];
  const otherItems = items.filter((item) => item.href !== currentPath);

  return (
    <div>
      <Typography variant="h4" className={cn("text-primary", disableHeading && "hidden")}>
        {"查看更多"}
      </Typography>
      <ul>
        {otherItems.map((item) => (
          <li key={item.title}>
            <LinkTransition href={item.href as Href}>{item.title}</LinkTransition>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface LoadingProps {
  className?: string;
}
export default function Loading({ className }: LoadingProps) {
  const t = useTranslations()
  return (
    <div className={cn("z-10 h-screen flex items-center justify-center", className)}>
      <LoaderCircle className="animate-spin icon mr-2" />
      {`${t("Loading")}...`}
    </div>
  );
}

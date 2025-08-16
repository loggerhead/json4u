import { cn } from "@/lib/utils";
import { ArrowLeftToLine, ArrowRightToLine } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * @description A hint component to indicate that the panel can be collapsed.
 * @param {object} props - The component props.
 * @param {'left' | 'right'} props.side - The side to display the hint on.
 * @returns {JSX.Element} The hint component.
 */
export function CollapseHint({ side }: { side: "left" | "right" }) {
  const t = useTranslations();

  return (
    <div
      title={t("collapse_hint")}
      className={cn(
        "absolute top-0 h-full w-12 bg-gray-200/70 flex items-center justify-center text-xs text-gray-600 z-10 writing-mode-vertical-rl text-orientation-mixed whitespace-pre-line",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      {side === "left" ? <ArrowLeftToLine /> : <ArrowRightToLine />}
    </div>
  );
}

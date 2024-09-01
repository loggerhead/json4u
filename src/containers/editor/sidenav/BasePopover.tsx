import { type MessageKey } from "@/global";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface BasePopoverProps {
  title: MessageKey;
  children: React.ReactNode;
  optionsNode?: React.ReactNode;
  extraNode?: React.ReactNode;
  className?: string;
}

export default function BasePopover({ title, className, children, optionsNode, extraNode }: BasePopoverProps) {
  const t = useTranslations();

  return (
    <div className={cn("w-fit text-sm space-y-2", className)}>
      <div className="flex flex-col text-center sm:text-left">
        <h3 className="text-lg font-semibold mb-2">{t(title)}</h3>
        <div className="flex items-center gap-1">{children}</div>
      </div>
      {optionsNode && <div className="flex flex-col text-center sm:text-left">{optionsNode}</div>}
      {extraNode}
    </div>
  );
}

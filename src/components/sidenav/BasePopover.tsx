import { type MessageKey } from "@/global";
import { useTranslations } from "next-intl";

export interface BasePopoverProps {
  title: MessageKey;
  children: React.ReactNode;
  optionsNode?: React.ReactNode;
  extraNode?: React.ReactNode;
}

export default function BasePopover({ title, children, optionsNode, extraNode }: BasePopoverProps) {
  const t = useTranslations();

  return (
    <div className="w-96 text-sm space-y-2">
      <div className="flex flex-col text-center sm:text-left">
        <h3 className="text-lg font-semibold mb-2">{t(title)}</h3>
        <div className="flex items-center gap-1">{children}</div>
      </div>
      <div className="flex flex-col text-center sm:text-left">{optionsNode}</div>
      {extraNode}
    </div>
  );
}

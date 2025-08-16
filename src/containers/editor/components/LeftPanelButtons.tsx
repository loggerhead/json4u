import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toastSucc } from "@/lib/utils";
import { useEditor } from "@/stores/editorStore";
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LeftPanelButtons() {
  const t = useTranslations();
  const editor = useEditor()!;
  const [copied, setCopied] = useState(false);
  const Icon = copied ? Check : Copy;

  return (
    <div className="flex items-center ml-auto pl-2 space-x-2">
      <Button
        title={t("Copy")}
        className="px-2"
        variant={copied ? "icon" : "icon-outline"}
        onClick={() => {
          editor &&
            navigator.clipboard.writeText(editor.text()).then(() => {
              setCopied(true);
              toastSucc(t("Copied"));
              setTimeout(() => setCopied(false), 2000);
            });
        }}
      >
        <Icon className="icon" />
      </Button>
    </div>
  );
}

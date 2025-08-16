import { useState } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { Button } from "@/components/ui/button";
import CommandSearchInput from "@/components/ui/search/CommandSearchInput";
import Editor from "@/containers/editor/editor/Editor";
import { toastSucc } from "@/lib/utils";
import { useEditor } from "@/stores/editorStore";
import { Copy, CopyCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LeftPanel() {
  return (
    <Container>
      <ContainerHeader>
        <CommandSearchInput />
        <Buttons />
      </ContainerHeader>
      <ContainerContent>
        <Editor kind="main" />
      </ContainerContent>
    </Container>
  );
}

function Buttons() {
  const t = useTranslations();
  const editor = useEditor()!;
  const [copied, setCopied] = useState(false);
  const Icon = copied ? CopyCheck : Copy;

  return (
    <div className="flex items-center ml-auto pl-2 space-x-2">
      <Button
        title={t("Copy")}
        className="px-2"
        variant="icon-outline"
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

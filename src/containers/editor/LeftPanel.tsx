"use client";

import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { Button } from "@/components/ui/button";
import CommandSearchInput from "@/components/ui/search/CommandSearchInput";
import Editor from "@/containers/editor/editor/loader";
import { useEditorStore } from "@/stores/editorStore";
import { useTranslations } from "next-intl";

export default function LeftPanel() {
  const t = useTranslations();
  const runCommand = useEditorStore((state) => state.runCommand);

  return (
    <Container>
      <ContainerHeader>
        <CommandSearchInput />
        <div className="flex items-center ml-auto">
          <Button onClick={() => runCommand("format")}>{t("format")}</Button>
          <Button onClick={() => runCommand("unescape")}>{t("unescape")}</Button>
        </div>
      </ContainerHeader>
      <ContainerContent>
        <Editor kind="main" />
      </ContainerContent>
    </Container>
  );
}

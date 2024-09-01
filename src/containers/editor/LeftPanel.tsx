"use client";

import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { Button } from "@/components/ui/button";
import Editor from "@/containers/editor/editor/loader";
import { useEditorStore } from "@/stores/editorStore";
import { useTranslations } from "next-intl";
import { CommandSearch } from "./Command";

export default function LeftPanel() {
  const t = useTranslations();
  const callCommand = useEditorStore((state) => state.callCommand);

  return (
    <Container>
      <ContainerHeader>
        <CommandSearch />
        <div className="flex items-center ml-auto">
          <Button onClick={() => callCommand("format")}>{t("format")}</Button>
          <Button onClick={() => callCommand("unescape")}>{t("unescape")}</Button>
        </div>
      </ContainerHeader>
      <ContainerContent>
        <Editor kind="main" />
      </ContainerContent>
    </Container>
  );
}

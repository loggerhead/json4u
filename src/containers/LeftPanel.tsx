"use client";

import { CommandSearch } from "@/components/Command";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import Editor from "@/components/editor/loader";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores";
import { useTranslations } from "next-intl";

export const leftPanelId = "left-panel";

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

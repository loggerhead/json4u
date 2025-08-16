import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import CommandSearchInput from "@/components/ui/search/CommandSearchInput";
import { LeftPanelButtons } from "@/containers/editor/components";
import Editor from "@/containers/editor/editor/Editor";

export default function LeftPanel() {
  return (
    <Container>
      <ContainerHeader>
        <CommandSearchInput />
        <LeftPanelButtons />
      </ContainerHeader>
      <ContainerContent>
        <Editor kind="main" />
      </ContainerContent>
    </Container>
  );
}

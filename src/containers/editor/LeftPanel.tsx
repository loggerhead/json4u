import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import CommandSearchInput from "@/components/ui/search/CommandSearchInput";
import Editor from "@/containers/editor/editor/loader";

export default function LeftPanel() {
  return (
    <Container>
      <ContainerHeader>
        <CommandSearchInput />
      </ContainerHeader>
      <ContainerContent>
        <Editor kind="main" />
      </ContainerContent>
    </Container>
  );
}

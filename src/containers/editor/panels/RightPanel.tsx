import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { TabIcon, TabView } from "@/containers/editor/components";
import RightPanelButtons from "@/containers/editor/components/RightPanelButtons";
import Editor from "@/containers/editor/editor/Editor";
import Graph from "@/containers/editor/graph/Graph";
import { Table } from "@/containers/editor/table/Table";
import { ViewMode, ViewModeValue } from "@/lib/db/config";
import { useConfigFromCookies } from "@/stores/hook";
import { useStatusStore } from "@/stores/statusStore";
import { useShallow } from "zustand/shallow";

export default function RightPanel() {
  const cc = useConfigFromCookies();
  const { viewMode, setViewMode } = useStatusStore(
    useShallow((state) => ({
      viewMode: state._hasHydrated ? state.viewMode : cc.viewMode,
      setViewMode: state.setViewMode,
    })),
  );

  return (
    <Tabs asChild defaultValue={viewMode} value={viewMode} onValueChange={(mode) => setViewMode(mode as ViewModeValue)}>
      <Container>
        <ContainerHeader>
          <TabsList>
            {[ViewMode.Text, ViewMode.Graph, ViewMode.Table].map((mode) => (
              <TabIcon key={mode} viewMode={mode} className="icon" />
            ))}
          </TabsList>
          <RightPanelButtons viewMode={viewMode} />
        </ContainerHeader>
        <ContainerContent>
          <TabView viewMode={ViewMode.Text}>
            <Editor kind="secondary" />
          </TabView>
          <TabView viewMode={ViewMode.Graph}>
            <Graph />
          </TabView>
          <TabView viewMode={ViewMode.Table}>
            <Table />
          </TabView>
        </ContainerContent>
      </Container>
    </Tabs>
  );
}

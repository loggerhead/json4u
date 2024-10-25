import { useCallback } from "react";
import SearchInput from "@/components/ui/search/SearchInput";
import { type MessageKey } from "@/global";
import { useEditorStore } from "@/stores/editorStore";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";

export default function CommandSearch() {
  const t = useTranslations();
  const { commands, runCommand } = useEditorStore(
    useShallow((state) => ({
      commands: state.commands.filter((c) => !c.hidden),
      runCommand: state.runCommand,
    })),
  );
  const search = useCallback(
    (input: string) => commands.filter((cmd) => cmd.id.includes(input) || t(cmd.id).includes(input)),
    [commands, t],
  );

  return (
    <SearchInput
      id="cmd-search"
      bindShortcut="K"
      displayShortcut
      openListOnFocus
      placeholder={"Search Command"}
      search={search}
      onSelect={(cmd) => runCommand(cmd.id)}
      itemHeight={32}
      Item={({ id, Icon }) => (
        <div className="w-full h-8 flex items-center">
          {Icon && <Icon className="icon mr-2" />}
          {t(id as MessageKey)}
        </div>
      )}
    />
  );
}

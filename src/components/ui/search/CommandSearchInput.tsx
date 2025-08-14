import SearchInput from "@/components/ui/search/SearchInput";
import { type MessageKey } from "@/global";
import { type Command, useEditorStore } from "@/stores/editorStore";
import fuzzysort from "fuzzysort";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";

export default function CommandSearch() {
  const t = useTranslations();
  const { commands, runCommand } = useEditorStore(
    useShallow((state) => ({
      commands: state.commands,
      runCommand: state.runCommand,
    })),
  );
  const displayCommands = commands.filter((c) => !c.hidden);

  const search = (input: string) =>
    input.trim()
      ? fuzzysort
          .go(input, displayCommands, {
            keys: [(cmd) => cmd.id, (cmd) => t(cmd.id)],
          })
          .map((r) => r.obj)
      : displayCommands;

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
      Item={Item}
    />
  );
}

function Item({ id, Icon }: Command) {
  const t = useTranslations();
  return (
    <div className="h-8 flex items-center whitespace-nowrap overflow-x-hidden" title={t(id as MessageKey)}>
      {Icon && <Icon className="icon mr-2" />}
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{t(id as MessageKey)}</span>
    </div>
  );
}

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command as Cmd,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type MessageKey } from "@/global";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore, useStatusStoreCtx } from "@/stores/statusStore";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";

export function CommandSearch() {
  const t = useTranslations();
  const { open, setOpen } = useOpen();
  const { commands, callCommand } = useCommands();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="input" role="combobox" aria-expanded={open} className="w-command h-7 justify-start gap-2">
          <Search className="icon" />
          <span>{t("Search Command")}</span>
          <span className="ml-auto search-cmd-kbd">
            <kbd>{"⌘ K"}</kbd>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-command p-0">
        <Cmd>
          <CommandInput className="h-7" />
          <CommandList>
            <CommandEmpty>{t("no_command_found")}</CommandEmpty>
            <CommandGroup>
              {commands.map(({ name: label, Icon }) => (
                <CommandItem
                  key={label}
                  value={`${label}:${t(label as MessageKey)}`}
                  onSelect={(value) => {
                    const name = value.split(":")[0];
                    callCommand(name);
                    setOpen(false);
                  }}
                >
                  {Icon && <Icon className="icon mr-2" />}
                  {t(label as MessageKey)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Cmd>
      </PopoverContent>
    </Popover>
  );
}

function useCommands() {
  const statusStore = useStatusStoreCtx();
  const { addCommand, commands, callCommand } = useEditorStore(
    useShallow((state) => ({
      addCommand: state.addCommand,
      commands: state.commands.filter((c) => !c.hidden),
      callCommand: state.callCommand,
    })),
  );

  useEffect(() => {
    addCommand({
      name: "show_jq",
      call: () => statusStore.getState().setCommandMode("jq"),
    });
  }, []);

  return { commands, callCommand };
}

function useOpen() {
  const { commandOpen, setCommandOpen } = useStatusStore(
    useShallow((state) => ({
      commandOpen: state.commandOpen,
      setCommandOpen: state.setCommandOpen,
    })),
  );

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setCommandOpen(!commandOpen);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [commandOpen]);

  return { open: commandOpen, setOpen: setCommandOpen };
}

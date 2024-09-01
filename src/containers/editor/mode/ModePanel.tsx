import React, { useEffect, useRef, useState } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { type CommandMode, useStatusStore } from "@/stores/statusStore";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import JqInput from "./JqInput";

type FC<T extends HTMLElement = HTMLElement> = React.FC<{
  className?: string;
  ref?: React.RefCallback<T> | React.ForwardedRef<T> | React.LegacyRef<T>;
}>;

const mode2component: Record<CommandMode, FC> = {
  jq: JqInput as FC,
};

export default function ModePanel() {
  const ref = useRef<Partial<Record<CommandMode, any>>>({});
  const [open, setOpen] = useState(false);
  const { leftPanelWidth, commandMode } = useStatusStore(
    useShallow((state) => ({
      leftPanelWidth: state.leftPanelWidth,
      commandMode: state.commandMode,
    })),
  );
  const ModeComponent = mode2component[commandMode!];

  useEffect(() => {
    setOpen(!!commandMode);
    const el = ref.current[commandMode!];
    el?.focus && el.focus();
  }, [commandMode]);

  return (
    <Collapsible className="relative" defaultOpen={false} open={open} onOpenChange={setOpen}>
      <CollapsibleContent id="cmd-panel" className="min-w-80" style={{ width: leftPanelWidth }}>
        {commandMode && (
          <ModeComponent
            className="ml-4 my-2 grow"
            ref={(el) => {
              ref.current[commandMode] = el;
              el?.focus && el.focus();
            }}
          />
        )}
        <CloseButton />
      </CollapsibleContent>
    </Collapsible>
  );
}

// TODO: change to use css variable to decide the color
function CloseButton() {
  const setCommandMode = useStatusStore((state) => state.setCommandMode);

  return (
    <button
      className="ml-1 px-1 hover:bg-accent hover:text-accent-foreground"
      onClick={() => setCommandMode(undefined)}
    >
      <X style={{ width: 12, height: 12, color: "#47474780" }} />
    </button>
  );
}

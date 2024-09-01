import { type ComponentPropsWithoutRef, type ElementRef, forwardRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ViewMode } from "@/lib/db/config";
import { jq } from "@/lib/jq";
import { cn, toastErr, toastSucc } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useUserStore } from "@/stores/userStore";
import { debounce } from "lodash-es";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";

const elementId = "jq-input";

const JqInput = forwardRef<ElementRef<typeof Input>, ComponentPropsWithoutRef<typeof Input>>(
  ({ className, ...props }, ref) => {
    const t = useTranslations();
    const usable = useUserStore((state) => state.usable("jqExecutions"));
    const setCommandMode = useStatusStore((state) => state.setCommandMode);
    const execJq = useExecJq();
    const onChange = useCallback(
      debounce(async (ev) => execJq(ev.target.value), 1000, { trailing: true }),
      [execJq],
    );

    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Input
          id={elementId}
          type="text"
          disabled={!usable}
          placeholder={usable ? t("jq_placeholder") : t("jq_disabled")}
          ref={ref}
          onChange={onChange}
          onKeyDown={(ev) => {
            const el = ev.target as HTMLInputElement;

            if (ev.key === "Enter") {
              execJq(el.value);
              onChange.cancel();
            } else if (ev.key === "Escape") {
              setCommandMode(undefined);
            }
          }}
        />
        <Button variant="outline" onClick={async () => execJq()}>
          {t("Execute")}
        </Button>
      </div>
    );
  },
);

function useExecJq() {
  const t = useTranslations();
  const { main, secondary } = useEditorStore(
    useShallow((state) => ({
      main: state.main,
      secondary: state.secondary,
      callCommand: state.callCommand,
    })),
  );
  const { viewMode, setViewMode } = useStatusStore(
    useShallow((state) => ({
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
      setCommandMode: state.setCommandMode,
    })),
  );
  const count = useUserStore((state) => state.count);

  return useCallback(async (filter?: string) => {
    if (filter === "undefined") {
      filter = (document.getElementById(elementId) as HTMLInputElement).value;
    }
    if (!filter) {
      toastSucc(t("cmd_exec_succ", { name: "jq" }));
      return;
    }

    if (viewMode != ViewMode.Text) {
      setViewMode(ViewMode.Text);
    }

    const { output, error } = await jq(main!.text(), filter);

    if (error) {
      toastErr(t("cmd_exec_fail", { name: "jq" }) + ": " + filter);
    } else {
      await secondary!.parseAndSet(output, {}, false);
      toastSucc(t("cmd_exec_succ", { name: "jq" }));
      count("jqExecutions");
    }
  }, []);
}

JqInput.displayName = "JqInput";
export default JqInput;

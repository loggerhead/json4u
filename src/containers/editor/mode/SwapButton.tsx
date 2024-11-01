import { forwardRef, useEffect } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";

const SwapButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const t = useTranslations();
    const runCommand = useEditorStore((state) => state.runCommand);

    useEffect(() => {
      if (!runCommand) return;

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          runCommand("swapLeftRight");
        }
      };

      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [runCommand]);

    return (
      <Button
        title={t("swap_left_right")}
        size={size}
        variant={variant}
        className={className}
        onClick={() => runCommand("swapLeftRight")}
      >
        <ArrowRightLeft className="icon" />
      </Button>
    );
  },
);

SwapButton.displayName = "SwapButton";
export default SwapButton;

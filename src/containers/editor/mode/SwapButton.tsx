import { forwardRef, useCallback, useEffect } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";

const SwapButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const t = useTranslations();
    const callCommand = useEditorStore((state) => state.callCommand);
    const onClick = useCallback(() => callCommand("swapLeftRight"), [callCommand]);

    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      };

      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClick]);

    return (
      <Button title={t("swap_left_right")} size={size} variant={variant} className={className} onClick={onClick}>
        <ArrowRightLeft className="icon" />
      </Button>
    );
  },
);

SwapButton.displayName = "SwapButton";
export default SwapButton;

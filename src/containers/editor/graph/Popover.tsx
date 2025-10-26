import React, { memo } from "react";
import { globalStyle } from "@/lib/graph/style";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";

interface PopoverProps extends React.PropsWithChildren {
  text: string;
  hlClassNames: string[];
  width?: number;
}

const Popover = memo(({ text, hlClassNames, width, children }: PopoverProps) => {
  const maxWidth = width ?? globalStyle.maxValueWidth;
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" align="start">
            <div className="popover-container" data-testid="graph-popover">
              <div className={cn("popover-item", ...hlClassNames)} style={{ maxWidth }}>
                {text}
              </div>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
});

Popover.displayName = "Popover";

export default Popover;

import React from "react";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";

interface PopoverProps extends React.PropsWithChildren {
  width: number;
  text: string;
  hlClassNames: string[];
}

export default function Popover({ width, text, hlClassNames, children }: PopoverProps) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top">
            <div className="popover-container" data-testid="graph-popover">
              <div className={cn("popover-item", ...hlClassNames)} style={{ maxWidth: width }}>
                {text}
              </div>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

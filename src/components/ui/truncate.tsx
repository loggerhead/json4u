import * as React from "react";
import { cn } from "@/lib/utils";

type TruncateProps = React.ComponentPropsWithoutRef<"div"> & {
  text: string;
};

// https://stackoverflow.com/a/71864029/2934618
const LeftTruncate = React.forwardRef<HTMLDivElement, TruncateProps>(({ className, text, ...props }, ref) => {
  const blankNum = text.length - text.trimEnd().length;

  return (
    <div ref={ref} className={cn("flex", className)} {...props}>
      <p className="left-truncate">
        <span className="left-truncate-content">{text.trim()}</span>
      </p>
      {blankNum > 0 && <pre> </pre>}
    </div>
  );
});
LeftTruncate.displayName = "LeftTruncate";

const RightTruncate = React.forwardRef<HTMLDivElement, TruncateProps>(({ className, text, ...props }, ref) => {
  const blankNum = text.length - text.trimStart().length;

  return (
    <div ref={ref} className={cn("flex", className)} {...props}>
      {blankNum > 0 && <pre> </pre>}
      <span className="truncate">{text}</span>
    </div>
  );
});
RightTruncate.displayName = "RightTruncate";

export { LeftTruncate, RightTruncate };

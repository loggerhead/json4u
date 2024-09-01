import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const Section = forwardRef<HTMLDivElement, SectionProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className={cn("relative w-full flex flex-col items-center text-left", className)}>
      {children}
    </div>
  );
});
Section.displayName = "Section";

export default Section;

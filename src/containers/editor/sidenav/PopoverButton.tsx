"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useStatusStore } from "@/stores/statusStore";
import Button from "./Button";

export const popoverBtnClass = "popover-btn";

interface PopoverBtnProps {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  contentClassName?: string;
  asChild?: boolean;
  notOnSideNav?: boolean;
}

export default function PopoverBtn({
  icon,
  title,
  notOnSideNav,
  className,
  contentClassName,
  asChild,
  content,
}: PopoverBtnProps) {
  const setSideNavExpanded = useStatusStore((state) => state.setSideNavExpanded);

  return (
    <Popover onOpenChange={notOnSideNav ? undefined : (open) => open && setSideNavExpanded(false)}>
      <PopoverTrigger asChild>
        <Button className={cn(className, notOnSideNav && "w-10")} icon={icon} title={title} />
      </PopoverTrigger>
      <PopoverContent
        asChild={asChild}
        side={notOnSideNav ? "bottom" : "right"}
        className={cn("w-fit", popoverBtnClass, contentClassName)}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

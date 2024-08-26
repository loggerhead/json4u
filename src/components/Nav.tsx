"use client";

import { ElementRef, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Toggle } from "./ui/toggle";

interface NavProps {
  isCollapsed: boolean;
  className?: string;
  btns: (Omit<NavButtonProps, "children"> & {
    title: string;
  })[];
}

export function Nav({ btns, isCollapsed, className }: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className={cn("group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2", className)}
    >
      <nav className="grid gap-1 mx-1 group-[[data-collapsed=true]]:px-px">
        {btns.map((btn, index) =>
          btn.popoverContent ? (
            <PopoverBtn key={index} {...btn} />
          ) : btn.onPressedChange ? (
            <NavToggle key={index} {...btn} />
          ) : (
            <NavBtn key={index} {...btn} />
          ),
        )}
      </nav>
    </div>
  );
}

interface NavButtonProps {
  title: string;
  icon: LucideIcon;
  isPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  onClick?: () => void;
  popoverContent?: React.ReactNode;
}

function Content({ title, icon: Icon }: NavButtonProps) {
  return (
    <div className="flex items-center w-full">
      <Icon />
      <span className="text-xs text-nowrap group-[[data-collapsed=false]]:ml-2 group-[[data-collapsed=true]]:sr-only">{title}</span>
    </div>
  );
}

function NavToggle({ title, isPressed, onPressedChange, ...props }: NavButtonProps) {
  return (
    <Toggle
      size="xs"
      className="w-full"
      title={title}
      defaultPressed={isPressed}
      pressed={isPressed}
      onPressedChange={onPressedChange}
    >
      <Content title={title} {...props} />
    </Toggle>
  );
}

const NavBtn = forwardRef<ElementRef<typeof Button>, NavButtonProps>(({ title, onClick, ...props }, ref) => (
  <Button ref={ref} size="xs" className="w-full" title={title} onClick={onClick}>
    <Content title={title} {...props} />
  </Button>
));
NavBtn.displayName = "NavBtn";

function PopoverBtn({ popoverContent, ...props }: NavButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <NavBtn {...props} />
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className={"w-fit"}>
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}

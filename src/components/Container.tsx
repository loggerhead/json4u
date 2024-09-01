"use client";

import { type ReactNode, type HTMLAttributes } from "react";
import { Separator } from "@/components/ui/separator";
import { type CommandMode } from "@/stores/statusStore";

export function Container({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="relative w-full h-full flex flex-col" {...props}>
      {children}
    </div>
  );
}

interface ContainerHeaderProps extends HTMLAttributes<HTMLDivElement> {
  mode?: CommandMode;
  modeHeaders?: Record<CommandMode, ReactNode>;
}

export function ContainerHeader({ children, mode, modeHeaders, ...props }: ContainerHeaderProps) {
  return (
    <>
      <div className="flex items-center w-full min-h-header px-4" {...props}>
        {children}
      </div>
      <Separator />
    </>
  );
}

export function ContainerContent({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="w-full max-h-full flex-grow" {...props}>
      {children}
    </div>
  );
}

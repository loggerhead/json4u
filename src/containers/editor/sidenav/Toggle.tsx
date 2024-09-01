import { ElementRef, forwardRef } from "react";
import { Toggle as RToggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import { btnVariants } from "./Button";
import IconLabel from "./IconLabel";

interface ToggleProps extends VariantProps<typeof btnVariants> {
  icon: React.ReactNode;
  title: string;
  isPressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  className?: string;
}

const Toggle = forwardRef<ElementRef<typeof RToggle>, ToggleProps>(
  ({ title, isPressed, onPressedChange, icon, className, ...props }, ref) => (
    <RToggle
      className={cn(btnVariants({}), "text-btn hover:bg-muted", className)}
      ref={ref}
      title={title}
      defaultPressed={isPressed}
      pressed={isPressed}
      onPressedChange={onPressedChange}
      {...props}
    >
      <IconLabel icon={icon} title={title} />
    </RToggle>
  ),
);
Toggle.displayName = "Toggle";

export default Toggle;

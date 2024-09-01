import { ElementRef, forwardRef } from "react";
import { Button as RButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import IconLabel from "./IconLabel";

export const btnVariants = cva(
  "w-6 h-6 relative group-data-[expanded=true]:w-full transition-all duration-200 flex items-center rounded-sm group-data-[expanded=false]:justify-center group-data-[expanded=true]:-space-x-2 hover:bg-surface-200",
);

interface ButtonProps extends VariantProps<typeof btnVariants> {
  title: string;
  onClick?: () => void;
  icon: React.ReactNode;
  className?: string;
}

const Button = forwardRef<ElementRef<typeof RButton>, ButtonProps>(({ icon, title, onClick, className }, ref) => (
  <RButton ref={ref} className={cn(btnVariants({}), className)} title={title} onClick={onClick}>
    <IconLabel icon={icon} title={title} />
  </RButton>
));
Button.displayName = "Button";

export default Button;

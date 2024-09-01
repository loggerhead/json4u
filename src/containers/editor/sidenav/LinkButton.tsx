import { ElementRef, forwardRef } from "react";
import RLinkButton, { type LinkButtonProps as RLinkButtonProps } from "@/components/LinkButton";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import IconLabel from "./IconLabel";

export const btnVariants = cva(
  "w-6 h-6 relative group-data-[expanded=true]:w-full transition-all duration-200 flex items-center rounded-sm group-data-[expanded=false]:justify-center group-data-[expanded=true]:-space-x-2 hover:bg-surface-200",
);

interface LinkButtonProps extends RLinkButtonProps, VariantProps<typeof btnVariants> {
  icon: React.ReactNode;
  title: string;
  notOnSideNav?: boolean;
}

const LinkButton = forwardRef<ElementRef<typeof RLinkButton>, LinkButtonProps>(
  ({ icon, title, notOnSideNav, className, ...props }, ref) => (
    <RLinkButton ref={ref} className={cn(btnVariants({}), className)} title={title} {...props}>
      <IconLabel notOnSideNav={notOnSideNav} icon={icon} title={title} />
    </RLinkButton>
  ),
);
LinkButton.displayName = "LinkButton";

export default LinkButton;

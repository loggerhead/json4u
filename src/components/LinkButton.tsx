import { forwardRef } from "react";
import { Link } from "@/navigation";
import { UrlObject } from "url";
import { Button, ButtonProps } from "./ui/button";

export interface LinkButtonProps extends ButtonProps {
  href: string | UrlObject;
  newWindow?: boolean;
}

const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(({ href, newWindow, children, ...props }, ref) => {
  return (
    <Link href={href} target={newWindow ? "_blank" : undefined}>
      <Button {...props}>{children}</Button>
    </Link>
  );
});
LinkButton.displayName = "LinkButton";

export default LinkButton;

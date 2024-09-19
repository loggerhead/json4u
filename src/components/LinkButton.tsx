import { forwardRef } from "react";
import Link, { LinkProps } from "next/link";
import { Route } from "next/types";
import { Button, ButtonProps } from "./ui/button";

export type Href = LinkProps<Route<string>>["href"];

export interface LinkButtonProps extends ButtonProps {
  href: Href;
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

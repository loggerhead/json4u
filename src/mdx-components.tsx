import { type ComponentPropsWithoutRef } from "react";
import type { MDXComponents } from "mdx/types";
import { Link } from "next-view-transitions";

type AnchorProps = ComponentPropsWithoutRef<"a">;

const custom = {
  a: ({ href, children, ...props }: AnchorProps) => {
    const className = "text-blue-500 hover:text-blue-700";

    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={className} {...props}>
          {children}
        </Link>
      );
    } else if (href?.startsWith("#")) {
      return (
        <a href={href} className={className} {...props}>
          {children}
        </a>
      );
    } else {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>
          {children}
        </a>
      );
    }
  },
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    ...custom,
  };
}

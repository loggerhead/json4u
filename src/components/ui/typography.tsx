import { cn } from "@/lib/utils"
import {
  cva,
  type VariantProps
} from "class-variance-authority"
import React from "react"

export const typographyVariants = cva("text-xl", {
  variants: {
    variant: {
      h1: "md:text-6xl scroll-m-20 text-4xl font-extrabold tracking-tight",
      h2: "scroll-m-20 pb-2 md:text-5xl text-3xl font-semibold tracking-tight first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      h5: "scroll-m-18 text-lg tracking-tight text-minor",
      p: "md:text-sm text-sm leading-7 text-minor"
    },
    affects: {
      default: "",
      lead: "md:text-xl text-xl font-normal",
      large: "md:text-lg text-lg font-semibold",
      small: "md:text-sm text-sm font-medium leading-none",
      muted: "md:text-sm text-sm text-muted-foreground",
      xs: "md:text-xs text-xs text-muted-foreground",
      removePMargin: "[&:not(:first-child)]:mt-0",
      bold: "text-sm font-semibold",
    }
  },
  defaultVariants: {
    variant: "p",
    affects: "default"
  }
})

export interface TypographyProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof typographyVariants> {}

const Typography = React.forwardRef<
  HTMLHeadingElement,
  TypographyProps
>(({ className, variant, affects, ...props }, ref) => {
  const Comp = variant ?? "p"
  return (
    <Comp
      ref={ref}
      {...props}
      className={cn(
        typographyVariants({ variant, affects }),
        className
      )}
    />
  )
})
Typography.displayName = "Typography"

export default Typography

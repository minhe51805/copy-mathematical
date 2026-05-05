import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9.6px] text-[15px] font-normal leading-[22.5px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#1F1E1D] text-white shadow-[var(--shadow-sm)] hover:bg-[#141413] hover:shadow-[var(--shadow-md)] active:scale-[0.98] dark:bg-[#FAF9F5] dark:text-[#1F1E1D] dark:hover:bg-white",
        destructive: "bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)] hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-border/30 bg-card text-foreground hover:border-border/60 hover:bg-secondary active:bg-muted",
        secondary: "border border-border/15 bg-card text-foreground shadow-[var(--shadow-sm)] hover:bg-secondary hover:shadow-[var(--shadow-md)] active:bg-muted",
        ghost: "border border-transparent bg-transparent text-foreground hover:border-border/30 hover:bg-foreground/[0.04] active:bg-foreground/[0.08]",
        link: "h-auto rounded-none border-0 p-0 text-foreground underline-offset-4 hover:text-[hsl(var(--terracotta))] hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-12 px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

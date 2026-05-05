import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[9.6px] border border-input/15 bg-card px-4 py-3 text-base font-[430] leading-[22.4px] text-[#141413] shadow-[var(--shadow-sm)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#3D3D3A]/60 hover:border-input/30 focus-visible:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-70 dark:text-foreground dark:placeholder:text-muted-foreground md:text-[15px]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }

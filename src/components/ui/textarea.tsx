import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[72px] w-full rounded-[9.6px] border border-input/15 bg-card px-4 py-3 text-base font-[430] leading-6 text-[#141413] shadow-[var(--shadow-sm)] placeholder:text-[#3D3D3A]/60 hover:border-input/30 focus-visible:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-70 dark:text-foreground dark:placeholder:text-muted-foreground md:text-[15px]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

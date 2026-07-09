import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          size === 'default' && "h-9 px-4 py-2",
          size === 'sm' && "h-8 px-3 text-xs",
          size === 'lg' && "h-10 px-8",
          size === 'icon' && "h-9 w-9",
          variant === 'default' && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
          variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          variant === 'outline' && "border border-input bg-transparent hover:bg-muted hover:text-foreground",
          variant === 'ghost' && "border-transparent bg-transparent hover:bg-muted hover:text-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
export { Button }
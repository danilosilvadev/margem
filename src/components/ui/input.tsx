import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-line bg-paper-2 px-3 text-sm text-ink placeholder:text-muted",
        className,
      )}
      {...props}
    />
  )
}

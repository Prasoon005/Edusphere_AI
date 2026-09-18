import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Frosted, translucent card used sparingly — landing page and dashboard highlight moments. */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-surface/60 backdrop-blur-xl shadow-popover",
        "dark:bg-white/5 dark:border-white/10",
        className
      )}
      {...props}
    />
  );
}

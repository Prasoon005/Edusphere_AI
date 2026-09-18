import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({ content, children, className }: { content: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-ink text-bg text-xs px-2 py-1 shadow-popover z-50",
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}

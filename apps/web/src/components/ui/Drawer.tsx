import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, side = "left", children, className }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden transition-opacity duration-200",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          "absolute top-0 h-full w-72 max-w-[85vw] bg-surface border-border shadow-popover transition-transform duration-200",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

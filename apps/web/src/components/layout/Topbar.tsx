import { useState } from "react";
import { LogOut, ChevronDown, KeyRound, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ChangePasswordDialog } from "@/components/account/ChangePasswordDialog";
import { cn } from "@/lib/utils";

function displayName(profile: Record<string, unknown> | null, email: string): string {
  const fullName = profile?.fullName;
  return typeof fullName === "string" && fullName.length > 0 ? fullName : email;
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  if (!user) return null;
  const name = displayName(user.profile, user.email);

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-4 sm:px-5">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors lg:hidden"
      >
        <Menu size={18} />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <NotificationCenter />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md pl-1 pr-2 py-1 hover:bg-surface-2 transition-colors"
          >
            <Avatar name={name} src={user.avatarUrl} size={28} />
            <span className="hidden sm:block text-sm font-medium text-ink max-w-[140px] truncate">{name}</span>
            <ChevronDown size={14} className="text-ink-muted" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div
                className={cn(
                  "absolute right-0 top-11 z-40 w-52 rounded-lg border border-border bg-surface shadow-popover animate-slide-up py-1"
                )}
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-ink truncate">{name}</p>
                  <p className="text-xs text-ink-muted truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setChangePasswordOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-2 transition-colors"
                >
                  <KeyRound size={14} />
                  Change password
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </header>
  );
}

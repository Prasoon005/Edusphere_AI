import { NavLink } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE } from "./navConfig";
import type { Role } from "@/types";

const BASE_PATH: Record<Role, string> = {
  SUPER_ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

export function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const sections = NAV_BY_ROLE[role];
  const basePath = BASE_PATH[role];

  return (
    <>
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap size={16} />
        </div>
        <span className="font-display font-semibold text-[15px] text-ink">EduSphere AI</span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === basePath}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    )
                  }
                >
                  <item.icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface h-screen sticky top-0">
      <SidebarNav role={role} />
    </aside>
  );
}

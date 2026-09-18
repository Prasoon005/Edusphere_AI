import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, SidebarNav } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Drawer } from "@/components/ui/Drawer";

export function AppShell() {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar role={user.role} />
      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <div className="flex flex-col h-full">
          <SidebarNav role={user.role} onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </Drawer>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 animate-fade-in overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

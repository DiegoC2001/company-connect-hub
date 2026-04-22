import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useGlobalMessageNotifications } from "@/hooks/useGlobalMessageNotifications";

export function AuthenticatedLayout({ children }: { children: ReactNode }) {
  useGlobalMessageNotifications();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
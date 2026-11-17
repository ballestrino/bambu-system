import { Suspense, type CSSProperties } from "react";
import { cookies } from "next/headers";

import {
  DashboardSidebar,
  DashboardSidebarFloatingTrigger,
} from "@/components/dashboard/dashboard-sidebar";
import { opsSurface } from "@/components/ops/shared/ops-theme";
import { SettingsDialog } from "@/components/settings/dialog/settings-dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Abierta 16,5 rem; compacta 4,5 rem (solo iconos).
const SIDEBAR_SIZES = {
  "--sidebar-width": "16.5rem",
  "--sidebar-width-icon": "4.5rem",
} as CSSProperties;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La barra recuerda si quedó abierta o compacta (cookie del SidebarProvider).
  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  // El dashboard no tiene la barra de arriba: el alto mínimo es la pantalla
  // menos los tabs de la app instalada.
  return (
    <SidebarProvider className="min-h-0" defaultOpen={defaultOpen} style={SIDEBAR_SIZES}>
      <DashboardSidebar />
      <DashboardSidebarFloatingTrigger />

      <main className="w-full min-w-0">
        <div
          className={cn(
            "relative flex min-h-[calc(100dvh-var(--bottom-tabs-space))] w-full flex-col items-center px-4 pb-6 pt-14 md:px-6 md:py-8 app-tabs:pt-[max(1.5rem,env(safe-area-inset-top))]",
            opsSurface.shell
          )}
        >
          {children}
        </div>
      </main>

      <Suspense fallback={null}>
        <SettingsDialog />
      </Suspense>
    </SidebarProvider>
  );
}

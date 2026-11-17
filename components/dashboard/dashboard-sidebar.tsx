"use client";

import { SidebarAccount } from "@/components/dashboard/sidebar/sidebar-account";
import { SidebarAgentButton } from "@/components/dashboard/sidebar/sidebar-agent-button";
import { SidebarBrand } from "@/components/dashboard/sidebar/sidebar-brand";
import { SidebarNav } from "@/components/dashboard/sidebar/sidebar-nav";
import { Sidebar, SidebarContent, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

// Dos formatos en escritorio: abierta (16,5 rem) y compacta, solo iconos con
// su nombre al pasar el mouse (4,5 rem). Se alterna con el botón de arriba o
// Ctrl+B y la cookie sidebar_state la recuerda. En el celular es una hoja.
export function DashboardSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnPhone = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="z-20 border-r border-ops-border bg-[#FAFCF9] dark:bg-[#151C14] [&>[data-sidebar=sidebar]]:bg-transparent"
    >
      <SidebarBrand />
      <SidebarAgentButton onNavigate={closeOnPhone} />
      <SidebarContent className="gap-1 pb-3 group-data-[collapsible=icon]:overflow-y-auto">
        <SidebarNav onNavigate={closeOnPhone} />
      </SidebarContent>
      <SidebarAccount />
    </Sidebar>
  );
}

// Sin la barra de arriba, en el celular (navegador) este botón abre la hoja.
// En la app instalada navegan los tabs de abajo.
export function DashboardSidebarFloatingTrigger() {
  const { isMobile, openMobile } = useSidebar();

  if (!isMobile || openMobile) {
    return null;
  }

  return (
    <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-30 app-tabs:hidden">
      <SidebarTrigger
        aria-label="Abrir menú"
        className="size-9 border border-ops-border bg-ops-surface/90 text-ops-text shadow-sm backdrop-blur hover:bg-ops-bamboo-soft"
      />
    </div>
  );
}

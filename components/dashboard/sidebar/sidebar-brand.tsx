"use client";

import Image from "next/image";

import { SidebarHeader, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

// Logo y nombre arriba; compacta, el botón para abrirla queda debajo del logo.
export function SidebarBrand() {
  const { isMobile, state } = useSidebar();
  const label = isMobile
    ? "Cerrar menú"
    : state === "expanded"
      ? "Compactar barra lateral"
      : "Abrir barra lateral";

  return (
    <SidebarHeader className="flex-row items-center justify-between gap-3 px-4 pt-5 pb-4 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <Image src="/images/logo.png" alt="Bambú" width={26} height={31} className="h-[31px] w-[26px] shrink-0 object-contain" />
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <p className="text-[15px] leading-tight font-semibold tracking-tight text-ops-text">Bambú</p>
          <p className="truncate text-xs text-ops-text-muted">Presupuestos y operaciones</p>
        </div>
      </div>
      <SidebarTrigger
        aria-label={label}
        title={`${label} (Ctrl+B)`}
        className="size-9 shrink-0 rounded-[10px] border border-ops-border bg-ops-surface text-ops-text-muted hover:bg-ops-bamboo-soft hover:text-ops-bamboo-strong"
      />
    </SidebarHeader>
  );
}

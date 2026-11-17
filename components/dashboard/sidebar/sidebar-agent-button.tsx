"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { agentNavItem } from "@/components/dashboard/dashboard-nav";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

// El agente va destacado arriba de los grupos, con su nombre.
export function SidebarAgentButton({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const Icon = agentNavItem.icon;

  return (
    <SidebarMenu className="px-3 pb-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="lg"
          isActive={agentNavItem.match(pathname)}
          tooltip={agentNavItem.title}
          onClick={onNavigate}
          className="h-[52px] gap-2.5 rounded-xl border border-ops-bamboo/40 bg-ops-bamboo-soft px-2.5 text-ops-bamboo-strong shadow-none transition-colors hover:bg-[#DCEFE0] hover:text-ops-bamboo-strong data-[active=true]:border-transparent data-[active=true]:bg-[#244C2D] data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-[#244C2D]/20 dark:hover:bg-ops-bamboo/25 dark:data-[active=true]:bg-[#4C653F] group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
        >
          <Link href={agentNavItem.url}>
            <span
              aria-hidden
              className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#3F8049] text-white in-data-[active=true]:bg-white/20 dark:bg-[#4C653F]"
            >
              <Icon className="size-[17px]" />
            </span>
            <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold">{agentNavItem.title}</span>
              <span className="truncate text-xs text-ops-text-muted in-data-[active=true]:text-white/80">
                Tu agente de Bambú
              </span>
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

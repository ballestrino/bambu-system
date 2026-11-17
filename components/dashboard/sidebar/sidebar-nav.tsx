"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavGroups } from "@/components/dashboard/dashboard-nav";
import { dashboardTools } from "@/components/dashboard/dashboard-tools";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const LABEL_CLASS =
  "px-3 text-[11px] font-semibold uppercase tracking-wider text-ops-text-muted";
const MENU_CLASS = "gap-0.5 px-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0";
// Compacta, el botón pasa a ser un cuadrado de 40 px con el icono centrado.
const ITEM_CLASS =
  "h-10 gap-3 rounded-[10px] px-3 font-medium text-ops-text transition-colors hover:bg-ops-bamboo-soft hover:text-ops-text data-[active=true]:bg-[#244C2D] data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-[#244C2D]/20 dark:data-[active=true]:bg-[#4C653F] group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&>svg]:size-[18px]!";

// Compacta, los títulos se ocultan y una línea fina separa los grupos.
function GroupSeparator() {
  return <SidebarSeparator className="mx-auto mb-1 hidden w-8! group-data-[collapsible=icon]:block" />;
}

export function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {dashboardNavGroups.map((group, index) => (
        <Fragment key={group.label}>
          {index > 0 && <GroupSeparator />}
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className={LABEL_CLASS}>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className={MENU_CLASS}>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.match(pathname)}
                      onClick={onNavigate}
                      tooltip={item.title}
                      className={ITEM_CLASS}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Fragment>
      ))}

      <GroupSeparator />
      <SidebarGroup className="py-1">
        <SidebarGroupLabel className={LABEL_CLASS}>Herramientas</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className={MENU_CLASS}>
            {dashboardTools.map((tool) => (
              <SidebarMenuItem key={tool.title}>
                <Dialog>
                  <DialogTrigger asChild>
                    <SidebarMenuButton tooltip={tool.title} className={ITEM_CLASS}>
                      <tool.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{tool.title}</span>
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogTitle className="sr-only">{tool.title}</DialogTitle>
                    {tool.content}
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

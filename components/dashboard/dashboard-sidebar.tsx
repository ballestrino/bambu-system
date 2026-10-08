"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavGroups } from "@/components/dashboard/dashboard-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar className="z-20 border-r border-[#53985E]/15 bg-[#F7FBF7]/90 backdrop-blur-xl dark:bg-[#121811]/90">
      <SidebarContent className={isMobile ? "" : "pt-16"}>
        <SidebarGroup>
          <div className="mb-3 flex items-center justify-between px-2 py-4">
            <div className="min-w-0">
              <SidebarGroupLabel className="h-auto px-0 text-xs font-bold uppercase tracking-wider text-[#53985E]">
                Bambu Dashboard
              </SidebarGroupLabel>
              <p className="mt-1 truncate text-xs text-[#244C2D]/70 dark:text-[#D4E3B8]/70">
                Presupuestos y operaciones
              </p>
            </div>
            <SidebarTrigger className="text-[#244C2D] hover:bg-[#EAF5EC] dark:text-[#D4E3B8] dark:hover:bg-[#2B3A28]" />
          </div>
        </SidebarGroup>

        {dashboardNavGroups.map((group) => (
          <SidebarGroup key={group.label} className="pt-0">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#244C2D]/55 dark:text-[#D4E3B8]/55">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2 px-2">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.match(pathname)}
                      onClick={() => isMobile && setOpenMobile(false)}
                      tooltip={item.title}
                      className="h-11 font-medium text-[#244C2D] transition-all duration-200 hover:bg-[#EAF5EC] hover:text-[#244C2D] data-[active=true]:bg-[#244C2D] data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-[#244C2D]/20 dark:text-[#E1EAD3] dark:hover:bg-[#2B3A28] dark:data-[active=true]:bg-[#4C653F]"
                    >
                      <Link href={item.url}>
                        <item.icon className="size-5!" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

export function DashboardSidebarFloatingTrigger() {
  const { isMobile, openMobile, state } = useSidebar();
  const shouldHide = isMobile ? openMobile : state === "expanded";

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed left-3 top-24 z-30 md:left-4 app-tabs:hidden">
      <SidebarTrigger className="border border-[#53985E]/20 bg-background/90 text-[#244C2D] shadow-sm hover:bg-[#EAF5EC] dark:text-[#D4E3B8]" />
    </div>
  );
}

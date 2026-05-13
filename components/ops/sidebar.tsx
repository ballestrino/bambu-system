"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { opsNavItems } from "@/components/ops/nav-items";
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

export function OpsSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar className="z-20 border-r border-[#53985E]/15 bg-[#F7FBF7]/90 backdrop-blur-xl dark:bg-[#101811]/90">
      <SidebarContent className={isMobile ? "" : "pt-16"}>
        <SidebarGroup>
          <div className="mb-3 flex items-center justify-between px-2 py-4">
            <div className="min-w-0">
              <SidebarGroupLabel className="h-auto px-0 text-xs font-bold uppercase tracking-wider text-[#53985E]">
                Operaciones
              </SidebarGroupLabel>
              <p className="mt-1 truncate text-xs text-[#244C2D]/70 dark:text-[#A7D8AE]/70">
                Agenda, equipo y dinero
              </p>
            </div>
            <SidebarTrigger className="text-[#244C2D] hover:bg-[#EAF5EC] dark:text-[#A7D8AE] dark:hover:bg-[#53985E]/15" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {opsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    onClick={() => isMobile && setOpenMobile(false)}
                    tooltip={item.title}
                    className="h-11 font-medium text-[#244C2D] transition-all duration-200 hover:bg-[#EAF5EC] hover:text-[#244C2D] data-[active=true]:bg-[#244C2D] data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-[#244C2D]/20 dark:text-[#D8EBDD] dark:hover:bg-[#53985E]/15 dark:data-[active=true]:bg-[#53985E]"
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
      </SidebarContent>
    </Sidebar>
  );
}

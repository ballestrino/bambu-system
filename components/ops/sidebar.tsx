"use client";

import Link from "next/link";
import { CalendarDays, CircleDollarSign, BriefcaseBusiness, HandCoins, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";

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

const items = [
  {
    title: "Trabajos",
    url: "/dashboard/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Calendario",
    url: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Empleados",
    url: "/dashboard/employees",
    icon: UsersRound,
  },
  {
    title: "Cobros",
    url: "/dashboard/payments",
    icon: CircleDollarSign,
  },
  {
    title: "Pagos",
    url: "/dashboard/payroll",
    icon: HandCoins,
  },
];

export function OpsSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar className="z-20 border-r-0 bg-white/55 backdrop-blur-xl">
      <SidebarContent className={isMobile ? "" : "pt-16"}>
        <SidebarGroup>
          <div className="mb-2 flex items-center justify-between px-2 py-4">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Operaciones
            </SidebarGroupLabel>
            <SidebarTrigger className="text-emerald-700 hover:bg-emerald-500/10" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    onClick={() => isMobile && setOpenMobile(false)}
                    className="h-10 font-medium transition-all duration-200 data-[active=true]:bg-emerald-700 data-[active=true]:text-white data-[active=true]:shadow-md hover:bg-emerald-500/10 hover:text-emerald-700"
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

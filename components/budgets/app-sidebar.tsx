"use client"

import { Home, List } from "lucide-react"
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
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
    {
        title: "Dashboard",
        url: "/dashboard/budgets",
        icon: Home,
    },
    {
        title: "Categorias",
        url: "/dashboard/budgets/categories",
        icon: List,
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const { setOpenMobile, isMobile } = useSidebar()

    return (
        <Sidebar className="z-20 border-r-0 bg-white/50 backdrop-blur-xl">
            <SidebarContent className={isMobile ? "" : "pt-16"}>
                <SidebarGroup>
                    <div className="flex justify-between items-center px-2 py-4 mb-2">
                        <SidebarGroupLabel className="text-[#53985E] font-bold text-xs uppercase tracking-wider">
                            Panel de presupuestos
                        </SidebarGroupLabel>
                        <SidebarTrigger className="text-[#53985E] hover:bg-[#53985E]/10" />
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-2 px-2">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        onClick={() => isMobile && setOpenMobile(false)}
                                        className="h-10 data-[active=true]:bg-[#53985E] data-[active=true]:text-white data-[active=true]:shadow-md hover:bg-[#53985E]/10 hover:text-[#53985E] transition-all duration-200 font-medium"
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
    )
}

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

    return (
        <Sidebar className="z-20">
            <SidebarContent className="pt-20">
                <SidebarGroup>
                    <div className="flex justify-between items-center gap-2">
                        <SidebarGroupLabel>Panel de presupuestos</SidebarGroupLabel>
                        <SidebarTrigger />
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                                        <Link href={item.url}>
                                            <item.icon />
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

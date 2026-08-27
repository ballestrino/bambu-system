"use client"

import Link from "next/link"

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export default function NavDashboard() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Dashboard</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[300px] gap-4">
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/dashboard/budgets">
                                        <div className="font-medium">Generador de presupuestos</div>
                                        <div className="text-muted-foreground text-sm">
                                            Calcula y edita escenarios
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/dashboard/official-budgets">
                                        <div className="font-medium">Presupuestos oficiales</div>
                                        <div className="text-muted-foreground text-sm">
                                            Publicaciones y versiones comerciales
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/dashboard">
                                        <div className="font-medium">Operaciones</div>
                                        <div className="text-muted-foreground text-sm">
                                            Resumen, trabajos y visitas operativas
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}

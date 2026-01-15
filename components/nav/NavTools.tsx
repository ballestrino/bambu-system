"use client"

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Calculator, CircleDollarSign } from "lucide-react"
import { CalculatorTool } from "@/components/tools/Calculator"
import { NominalRateConverter } from "@/components/tools/NominalRateConverter"

export default function NavTools() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Herramientas</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[320px] gap-2 p-4">
                            <li>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                            <div className="text-sm font-medium leading-none flex items-center gap-2">
                                                <CircleDollarSign className="h-4 w-4" /> Conversor Nominal
                                            </div>
                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                Calcula hora nominal vs líquida.
                                            </p>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <NominalRateConverter />
                                    </DialogContent>
                                </Dialog>
                            </li>
                            <li>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                            <div className="text-sm font-medium leading-none flex items-center gap-2">
                                                <Calculator className="h-4 w-4" /> Calculadora
                                            </div>
                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                Calculadora rápida para tus presupuestos.
                                            </p>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <CalculatorTool />
                                    </DialogContent>
                                </Dialog>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}

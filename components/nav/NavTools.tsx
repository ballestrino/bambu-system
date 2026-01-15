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
import { Calculator, Hammer, Ruler, CircleDollarSign } from "lucide-react"
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
                                        <div className="flex select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer hover:bg-muted/80 transition-colors">
                                            <CircleDollarSign className="h-6 w-6" />
                                            <div className="mb-2 mt-4 text-lg font-medium">
                                                Conversor Nominal
                                            </div>
                                            <p className="text-sm leading-tight text-muted-foreground">
                                                Calcula hora nominal vs líquida.
                                            </p>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <NominalRateConverter />
                                    </DialogContent>
                                </Dialog>
                            </li>
                            <li className="row-span-3">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="flex select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer hover:bg-muted/80 transition-colors">
                                            <Calculator className="h-6 w-6" />
                                            <div className="mb-2 mt-4 text-lg font-medium">
                                                Calculadora
                                            </div>
                                            <p className="text-sm leading-tight text-muted-foreground">
                                                Calculadora rápida para tus presupuestos.
                                            </p>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <CalculatorTool />
                                    </DialogContent>
                                </Dialog>
                            </li>
                            {/* Future tools placeholders */}
                            <li>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                            <div className="text-sm font-medium leading-none flex items-center gap-2">
                                                <Ruler className="h-4 w-4" /> Conversor
                                            </div>
                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                Próximamente...
                                            </p>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Conversor de Unidades</DialogTitle>
                                            <DialogDescription>
                                                Esta herramienta estará disponible próximamente.
                                            </DialogDescription>
                                        </DialogHeader>
                                    </DialogContent>
                                </Dialog>
                            </li>
                            <li>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
                                            <div className="text-sm font-medium leading-none flex items-center gap-2">
                                                <Hammer className="h-4 w-4" /> Materiales
                                            </div>
                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                Próximamente...
                                            </p>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Estimador de Materiales</DialogTitle>
                                            <DialogDescription>
                                                Esta herramienta estará disponible próximamente.
                                            </DialogDescription>
                                        </DialogHeader>
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

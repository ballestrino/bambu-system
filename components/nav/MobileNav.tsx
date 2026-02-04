"use client"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Calculator, CircleDollarSign, Menu, LayoutDashboard, Settings } from "lucide-react"
import NavLogo from "./NavLogo"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { NominalRateConverter } from "@/components/tools/NominalRateConverter"
import { CalculatorTool } from "@/components/tools/Calculator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
interface MobileNavProps {
    admin: boolean
    user: any
}

export default function MobileNav({ admin, user }: MobileNavProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-4 sm:w-[400px] flex flex-col h-full bg-background">
                <div className="flex items-center gap-2 h-12">
                    <NavLogo />
                </div>
                <div className="flex flex-col gap-6 flex-1 overflow-y-auto py-4">
                    {admin && (
                        <div className="flex flex-col gap-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Dashboard
                            </h4>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/dashboard/budgets"
                                    className="flex items-center gap-2 text-sm font-medium p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Presupuestos
                                </Link>
                            </div>
                        </div>
                    )}

                    {admin && (
                        <div className="flex flex-col gap-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Herramientas
                            </h4>
                            <div className="flex flex-col gap-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex w-full items-center gap-2 text-sm font-medium p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left">
                                            <CircleDollarSign className="h-4 w-4" />
                                            Conversor Nominal
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <NominalRateConverter />
                                    </DialogContent>
                                </Dialog>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex w-full items-center gap-2 text-sm font-medium p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left">
                                            <Calculator className="h-4 w-4" />
                                            Calculadora
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <CalculatorTool />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t pt-4 mt-auto space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tema</span>
                        <ThemeToggle />
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{user?.name || "Usuario"}</span>
                                <span className="text-xs text-muted-foreground">{user?.email}</span>
                            </div>
                        </div>
                        <Link href="/settings" onClick={() => setOpen(false)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </SheetContent>
        </Sheet >
    )
}

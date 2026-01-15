"use client"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Calculator, CircleDollarSign, Menu, LayoutDashboard } from "lucide-react"
import NavLogo from "./NavLogo"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { NominalRateConverter } from "@/components/tools/NominalRateConverter"
import { CalculatorTool } from "@/components/tools/Calculator"

interface MobileNavProps {
    admin: boolean
}

export default function MobileNav({ admin }: MobileNavProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="mb-6">
                    <SheetTitle>
                        <div className="flex items-center gap-2 h-12">
                            <NavLogo />
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6">
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
            </SheetContent>
        </Sheet>
    )
}

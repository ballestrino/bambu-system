import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { dashboardPrimaryActionClass } from "@/components/dashboard/dashboard-styles";

export default function Header() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Generador de presupuestos</h2>
                <p className="text-muted-foreground">
                    Crea y ajusta escenarios antes de publicarlos como precios oficiales.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Link href="/dashboard/budgets/create">
                    <Button className={dashboardPrimaryActionClass}>
                        <Plus className="mr-2 h-4 w-4" /> Crear presupuesto
                    </Button>
                </Link>
            </div>
        </div>
    )
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Header() {
    return (
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Presupuestos</h2>
                <p className="text-muted-foreground">
                    Aquí puedes ver y gestionar tus presupuestos.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Link href="/dashboard/budgets/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Crear Presupuesto
                    </Button>
                </Link>
            </div>
        </div>
    )
}

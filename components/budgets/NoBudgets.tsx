import Link from "next/link";
import { Button } from "../ui/button";

export default function NoBudgets() {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg border-dashed">
            <p className="text-muted-foreground mb-4">No se encontraron presupuestos.</p>
            <Link href="/dashboard/budgets/create">
                <Button variant="outline">Crear el primero</Button>
            </Link>
        </div>
    )
}

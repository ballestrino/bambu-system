import Link from "next/link";
import { Calculator } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BSE_DEFAULT_LABEL } from "@/lib/budget-bse";

// Un presupuesto guardado antes del BSE: lo manda al editor, en los aportes,
// donde "Calcular BSE" lo saca de la ganancia y el precio queda igual.
export const BudgetBseNotice = ({ slug }: { slug: string }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1">
      <p className="text-sm font-semibold">Este presupuesto no tiene el BSE calculado</p>
      <p className="text-sm text-muted-foreground">
        Calcularlo suma el {BSE_DEFAULT_LABEL} del sueldo nominal al costo y lo saca de la ganancia: el precio no cambia.
      </p>
    </div>
    <Button asChild className="shrink-0" variant="outline">
      <Link href={`/dashboard/budgets/edit/${slug}?seccion=aportes`}>
        <Calculator className="size-4" />
        Calcular BSE
      </Link>
    </Button>
  </div>
);

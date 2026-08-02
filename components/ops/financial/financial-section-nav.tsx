import Link from "next/link";

import { cn } from "@/lib/utils";
import { opsSurface } from "@/components/ops/shared";

const items = [
  { href: "#resumen", label: "Resumen" },
  { href: "#cobros", label: "Cobros" },
  { href: "#costes", label: "Costes" },
  { href: "#pagos", label: "Pagos" },
] as const;

export const FinancialSectionNav = () => (
  <nav
    aria-label="Secciones de Finanzas"
    className={cn(opsSurface.toolbar, "flex flex-wrap gap-2")}
  >
    {items.map((item) => (
      <Link
        className="rounded-md px-3 py-2 text-sm font-medium text-[#244C2D] transition-colors hover:bg-[#EAF5EC] dark:text-[#A7D8AE] dark:hover:bg-[#53985E]/15"
        href={item.href}
        key={item.href}
      >
        {item.label}
      </Link>
    ))}
  </nav>
);

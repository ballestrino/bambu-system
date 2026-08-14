import { TRANSPORTATION_PAY_PER_VISIT } from "@/components/ops/compensation-utils";
import { Clock3 } from "lucide-react";

import type { EmployeeSummaryJobRow } from "@/components/ops/employees/employee-summary-utils";
import { formatHours, formatMoney } from "@/components/ops/employees/employee-payroll";
import { OpsSection } from "@/components/ops/shared";

export const EmployeeSummaryChart = ({
  rows,
  transportationAmount,
  visits,
}: {
  rows: EmployeeSummaryJobRow[];
  transportationAmount: number;
  visits: number;
}) => {
  const maxHours = Math.max(...rows.map((row) => row.hours), 0);

  return (
    <OpsSection
      description="Distribucion de horas reales por trabajo completado en el periodo."
      title="Horas por trabajo"
    >
      {rows.length ? (
        <div className="space-y-4">
          {rows.map((row) => {
            const width = maxHours > 0 ? `${Math.max((row.hours / maxHours) * 100, 4)}%` : "4%";

            return (
              <div key={row.jobId} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.jobName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.visits} {row.visits === 1 ? "visita" : "visitas"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <Clock3 className="h-4 w-4 text-[#53985E]" />
                    <span className="font-semibold">{formatHours(row.hours)} hs</span>
                  </div>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-[#EAF5EC] dark:bg-[#2B3629]">
                  <div
                    className="h-full rounded-full bg-[#53985E]"
                    style={{ width }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Pago sugerido:{" "}
                  {row.paymentAmount === null ? "Sin tarifa" : formatMoney(row.paymentAmount)}
                </p>
              </div>
            );
          })}
          <div className="rounded-md border border-[#53985E]/15 bg-[#F8FBF8] p-3 text-sm dark:bg-[#1A211A]">
            <p className="font-medium text-[#244C2D] dark:text-[#D4E3B8]">
              Boleto
            </p>
            <p className="text-muted-foreground">
              {visits} {visits === 1 ? "visita" : "visitas"} *{" "}
              {formatMoney(TRANSPORTATION_PAY_PER_VISIT)} ={" "}
              {formatMoney(transportationAmount)}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-black/10 bg-white p-5 text-sm text-muted-foreground dark:bg-background/80">
          No hay trabajos completados para graficar en este periodo.
        </p>
      )}
    </OpsSection>
  );
};

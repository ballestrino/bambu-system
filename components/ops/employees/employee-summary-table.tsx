import type { EmployeeSummaryJobRow } from "@/components/ops/employees/employee-summary-utils";
import { formatHours, formatMoney } from "@/components/ops/employees/employee-payroll";
import { OpsSection } from "@/components/ops/shared";

export const EmployeeSummaryTable = ({
  rows,
}: {
  rows: EmployeeSummaryJobRow[];
}) => (
  <OpsSection
    description="Detalle usado para revisar horas, boletos y pago sugerido antes de exportar."
    title="Detalle por trabajo"
  >
    {rows.length ? (
      <div className="overflow-hidden rounded-md border border-[#53985E]/15">
        <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.9fr_0.9fr] gap-3 bg-[#EAF5EC] p-3 text-xs font-semibold uppercase tracking-wide text-[#244C2D] dark:bg-[#223326] dark:text-[#A7D8AE]">
          <span>Trabajo</span>
          <span>Horas</span>
          <span>Visitas</span>
          <span>Boleto</span>
          <span>Total</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.jobId}
            className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.9fr_0.9fr] gap-3 border-t border-[#53985E]/10 bg-white p-3 text-sm dark:bg-background/80"
          >
            <span className="min-w-0 truncate font-medium">{row.jobName}</span>
            <span>{formatHours(row.hours)} hs</span>
            <span>{row.visits}</span>
            <span>{formatMoney(row.transportationAmount)}</span>
            <span>{row.paymentAmount === null ? "Sin tarifa" : formatMoney(row.paymentAmount)}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="rounded-md border border-dashed border-black/10 bg-white p-5 text-sm text-muted-foreground dark:bg-background/80">
        No hay visitas realizadas para este periodo.
      </p>
    )}
  </OpsSection>
);

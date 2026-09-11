import { formatHours } from "@/components/ops/employees/employee-payroll";
import type { PayrollRow } from "@/components/ops/financial/financial-table-queries";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";
import { cn } from "@/lib/utils";

const formatNullableMoney = (value: number | null) =>
  value === null ? "-" : formatPayrollMoney(value);

const Detail = ({
  className,
  helper,
  label,
  value,
}: {
  className?: string;
  helper?: string;
  label: string;
  value: string;
}) => (
  <div className={cn("min-w-0", className)}>
    <dt className="text-xs font-medium uppercase tracking-wide text-ops-text-muted">
      {label}
    </dt>
    <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
    {helper ? <dd className="text-xs text-ops-text-muted">{helper}</dd> : null}
  </div>
);

// What the old per-employee card showed as eight tiles, now folded under the
// row. The first entries repeat the columns hidden on narrow screens.
export const FinancialPayrollRowDetails = ({ row }: { row: PayrollRow }) => (
  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
    <Detail className="md:hidden" label="Horas" value={`${formatHours(row.hours)} hs`} />
    <Detail className="lg:hidden" label="Visitas" value={String(row.visits)} />
    <Detail className="md:hidden" label="Sugerido" value={formatNullableMoney(row.suggestedAmount)} />
    <Detail className="sm:hidden" label="Pagos registrados" value={formatPayrollMoney(row.recordedTotal)} />
    <Detail
      label="Tarifa"
      value={row.hourlyRate === null ? "Pendiente" : `${formatPayrollMoney(row.hourlyRate)} / h`}
    />
    <Detail label="Boleto" value={formatPayrollMoney(row.transportationAmount)} />
    <Detail label="Aguinaldo generado" value={formatNullableMoney(row.aguinaldoGenerated)} />
    <Detail
      helper="1/12 de licencia menos 18,10% personal"
      label="Salario vacacional generado"
      value={formatNullableMoney(row.vacationSalaryGenerated)}
    />
    <Detail
      helper={
        row.bpsGenerated === null
          ? undefined
          : `Personal base ${formatNullableMoney(row.personalBpsGenerated)} · Patronal ${formatNullableMoney(row.employerBpsGenerated)}`
      }
      label="BPS generado base"
      value={formatNullableMoney(row.bpsGenerated)}
    />
  </dl>
);

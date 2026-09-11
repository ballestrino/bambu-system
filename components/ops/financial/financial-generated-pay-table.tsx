"use client";

import Link from "next/link";

import { TRANSPORTATION_PAY_PER_VISIT } from "@/components/ops/compensation-utils";
import { formatHours } from "@/components/ops/employees/employee-payroll";
import {
  generatedPayInitialSort,
  generatedPaySearchFields,
  generatedPaySortAccessors,
  type GeneratedPayRow,
} from "@/components/ops/financial/financial-table-queries";
import { formatMoney } from "@/components/ops/payments/payment-utils";
import {
  OpsDataTable,
  OpsSortableHead,
  OpsTableCell,
  OpsTableEmptyRow,
  OpsTableFooter,
  OpsTableHead,
  OpsTableHeader,
  OpsTablePagination,
  OpsTableRow,
  OpsTableSkeletonRows,
  opsTableLinkClass,
  opsTableSublineClass,
  useOpsTableState,
} from "@/components/ops/shared";
import { TableBody } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const COLUMN_COUNT = 7;

const visitsLabel = (visits: number) => `${visits} ${visits === 1 ? "visita" : "visitas"}`;

export const FinancialGeneratedPayTable = ({
  caption,
  isLoading,
  onClearQuery,
  query,
  resetKey,
  rows,
}: {
  caption: string;
  isLoading: boolean;
  onClearQuery: () => void;
  query: string;
  resetKey: string;
  rows: GeneratedPayRow[];
}) => {
  const table = useOpsTableState({
    getSearchFields: generatedPaySearchFields,
    initialSort: generatedPayInitialSort,
    query,
    resetKey,
    rows,
    sortAccessors: generatedPaySortAccessors,
  });
  const totals = table.rows.reduce(
    (sum, row) => ({
      amount: sum.amount + (row.amount ?? 0),
      hours: sum.hours + row.hours,
      labor: sum.labor + row.laborAmount,
      transportation: sum.transportation + row.transportationAmount,
      visits: sum.visits + row.visits,
    }),
    { amount: 0, hours: 0, labor: 0, transportation: 0, visits: 0 }
  );

  return (
    <OpsDataTable
      caption={caption}
      footer={
        <OpsTablePagination
          label="Páginas del pago generado"
          page={table}
          summary={`Boleto: ${formatMoney(TRANSPORTATION_PAY_PER_VISIT)} por visita realizada`}
        />
      }
    >
      <OpsTableHeader>
        <OpsTableRow className="hover:bg-transparent">
          <OpsSortableHead
            label="Empleada"
            onSort={() => table.toggleSort("employee")}
            sort={table.sort}
            sortKey="employee"
          />
          <OpsSortableHead
            align="right"
            className="hidden md:table-cell"
            label="Horas"
            onSort={() => table.toggleSort("hours", "desc")}
            sort={table.sort}
            sortKey="hours"
          />
          <OpsSortableHead
            align="right"
            className="hidden md:table-cell"
            label="Visitas"
            onSort={() => table.toggleSort("visits", "desc")}
            sort={table.sort}
            sortKey="visits"
          />
          <OpsTableHead className="hidden text-right lg:table-cell">Tarifa</OpsTableHead>
          <OpsTableHead className="hidden text-right lg:table-cell">Horas $</OpsTableHead>
          <OpsTableHead className="hidden text-right lg:table-cell">Boletos $</OpsTableHead>
          <OpsSortableHead
            align="right"
            label="Total"
            onSort={() => table.toggleSort("amount", "desc")}
            sort={table.sort}
            sortKey="amount"
          />
        </OpsTableRow>
      </OpsTableHeader>
      <TableBody aria-busy={isLoading || undefined}>
        {isLoading ? (
          <OpsTableSkeletonRows colSpan={COLUMN_COUNT} />
        ) : table.total === 0 ? (
          <OpsTableEmptyRow
            colSpan={COLUMN_COUNT}
            emptyDescription="Aparece cuando hay visitas realizadas con equipo asignado."
            emptyTitle="Sin pago generado en este mes"
            onClearQuery={onClearQuery}
            query={query}
          />
        ) : (
          table.pageRows.map((row) => (
            <OpsTableRow key={row.employeeId}>
              <OpsTableCell className="min-w-40 whitespace-normal">
                <Link className={opsTableLinkClass} href={`/dashboard/employees/${row.employeeId}`}>
                  {row.employeeName}
                </Link>
                <p className={cn(opsTableSublineClass, "md:hidden")}>
                  {formatHours(row.hours)} hs · {visitsLabel(row.visits)}
                </p>
              </OpsTableCell>
              <OpsTableCell className="hidden text-right tabular-nums md:table-cell">
                {formatHours(row.hours)}
              </OpsTableCell>
              <OpsTableCell className="hidden text-right tabular-nums md:table-cell">
                {row.visits}
              </OpsTableCell>
              <OpsTableCell className="hidden text-right tabular-nums lg:table-cell">
                {row.hourlyRate === null ? "Pendiente" : `${formatMoney(row.hourlyRate)} / h`}
              </OpsTableCell>
              <OpsTableCell className="hidden text-right tabular-nums lg:table-cell">
                {row.hourlyRate === null ? "-" : formatMoney(row.laborAmount)}
              </OpsTableCell>
              <OpsTableCell className="hidden text-right tabular-nums lg:table-cell">
                {formatMoney(row.transportationAmount)}
              </OpsTableCell>
              <OpsTableCell className="text-right font-semibold tabular-nums">
                {row.amount === null ? (
                  <span className="font-normal text-ops-text-muted">Tarifa pendiente</span>
                ) : (
                  formatMoney(row.amount)
                )}
              </OpsTableCell>
            </OpsTableRow>
          ))
        )}
      </TableBody>
      {!isLoading && table.total > 1 ? (
        <OpsTableFooter>
          <OpsTableRow className="hover:bg-transparent">
            <OpsTableCell>Total · {table.total} empleadas</OpsTableCell>
            <OpsTableCell className="hidden text-right tabular-nums md:table-cell">
              {formatHours(totals.hours)}
            </OpsTableCell>
            <OpsTableCell className="hidden text-right tabular-nums md:table-cell">
              {totals.visits}
            </OpsTableCell>
            <OpsTableCell className="hidden lg:table-cell" />
            <OpsTableCell className="hidden text-right tabular-nums lg:table-cell">
              {formatMoney(totals.labor)}
            </OpsTableCell>
            <OpsTableCell className="hidden text-right tabular-nums lg:table-cell">
              {formatMoney(totals.transportation)}
            </OpsTableCell>
            <OpsTableCell className="text-right tabular-nums">
              {formatMoney(totals.amount)}
            </OpsTableCell>
          </OpsTableRow>
        </OpsTableFooter>
      ) : null}
    </OpsDataTable>
  );
};

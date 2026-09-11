"use client";

import { useState } from "react";

import { formatHours } from "@/components/ops/employees/employee-payroll";
import {
  FinancialPayrollRow,
  PAYROLL_COLUMN_COUNT,
} from "@/components/ops/financial/financial-payroll-row";
import {
  payrollInitialSort,
  payrollSearchFields,
  payrollSortAccessors,
  type PayrollRow,
} from "@/components/ops/financial/financial-table-queries";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";
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
  useOpsTableState,
} from "@/components/ops/shared";
import type { OpsEmployee } from "@/components/ops/types";
import { TableBody } from "@/components/ui/table";

export const FinancialPayrollTable = ({
  caption,
  employees,
  isLoading,
  onClearQuery,
  periodEnd,
  periodStart,
  query,
  resetKey,
  rows,
}: {
  caption: string;
  employees: OpsEmployee[];
  isLoading: boolean;
  onClearQuery: () => void;
  periodEnd: string;
  periodStart: string;
  query: string;
  resetKey: string;
  rows: PayrollRow[];
}) => {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());
  const table = useOpsTableState({
    getSearchFields: payrollSearchFields,
    initialSort: payrollInitialSort,
    query,
    resetKey,
    rows,
    sortAccessors: payrollSortAccessors,
  });
  // Same arithmetic as getPayrollSummary: the balance is suggested minus paid,
  // so it reconciles with the Saldo KPI instead of summing per-row nulls.
  const totals = table.rows.reduce(
    (sum, row) => ({
      hours: sum.hours + row.hours,
      recorded: sum.recorded + row.recordedTotal,
      suggested: sum.suggested + (row.suggestedAmount ?? 0),
      visits: sum.visits + row.visits,
    }),
    { hours: 0, recorded: 0, suggested: 0, visits: 0 }
  );
  const balanceTotal = totals.suggested - totals.recorded;

  const toggleRow = (employeeId: string) =>
    setExpandedIds((current) => {
      const next = new Set(current);
      if (!next.delete(employeeId)) next.add(employeeId);
      return next;
    });

  const sortHead = (
    label: string,
    key: Parameters<typeof table.toggleSort>[0],
    className?: string
  ) => (
    <OpsSortableHead
      align="right"
      className={className}
      label={label}
      onSort={() => table.toggleSort(key, "desc")}
      sort={table.sort}
      sortKey={key}
    />
  );

  return (
    <OpsDataTable
      caption={caption}
      footer={<OpsTablePagination label="Páginas de pagos por empleada" page={table} />}
    >
      <OpsTableHeader>
        <OpsTableRow className="hover:bg-transparent">
          <OpsSortableHead
            label="Empleada"
            onSort={() => table.toggleSort("employee")}
            sort={table.sort}
            sortKey="employee"
          />
          {sortHead("Horas", "hours", "hidden md:table-cell")}
          {sortHead("Visitas", "visits", "hidden lg:table-cell")}
          {sortHead("Sugerido", "suggested", "hidden md:table-cell")}
          {sortHead("Pagado", "recorded", "hidden sm:table-cell")}
          {sortHead("Saldo", "balance", "hidden sm:table-cell")}
          <OpsTableHead className="hidden w-0 sm:table-cell">
            <span className="sr-only">Acciones</span>
          </OpsTableHead>
        </OpsTableRow>
      </OpsTableHeader>
      <TableBody aria-busy={isLoading || undefined}>
        {isLoading ? (
          <OpsTableSkeletonRows colSpan={PAYROLL_COLUMN_COUNT} />
        ) : table.total === 0 ? (
          <OpsTableEmptyRow
            colSpan={PAYROLL_COLUMN_COUNT}
            emptyDescription="Aparece cuando hay horas realizadas en el mes anterior o pagos registrados en este mes."
            emptyTitle="No hay horas ni pagos para este periodo"
            onClearQuery={onClearQuery}
            query={query}
          />
        ) : (
          table.pageRows.map((row) => (
            <FinancialPayrollRow
              employees={employees}
              isExpanded={expandedIds.has(row.employeeId)}
              key={row.employeeId}
              onToggle={() => toggleRow(row.employeeId)}
              periodEnd={periodEnd}
              periodStart={periodStart}
              row={row}
            />
          ))
        )}
      </TableBody>
      {!isLoading && table.total > 1 ? (
        <OpsTableFooter>
          <OpsTableRow className="hover:bg-transparent">
            <OpsTableCell>
              <div className="flex justify-between gap-3">
                <span>Total · {table.total} empleadas</span>
                <span className="tabular-nums sm:hidden">{formatPayrollMoney(balanceTotal)}</span>
              </div>
            </OpsTableCell>
            <OpsTableCell className="hidden text-right tabular-nums md:table-cell">
              {formatHours(totals.hours)}
            </OpsTableCell>
            <OpsTableCell className="hidden text-right tabular-nums lg:table-cell">
              {totals.visits}
            </OpsTableCell>
            <OpsTableCell className="hidden text-right tabular-nums md:table-cell">
              {formatPayrollMoney(totals.suggested)}
            </OpsTableCell>
            <OpsTableCell className="hidden text-right tabular-nums sm:table-cell">
              {formatPayrollMoney(totals.recorded)}
            </OpsTableCell>
            <OpsTableCell className="hidden text-right tabular-nums sm:table-cell">
              {formatPayrollMoney(balanceTotal)}
            </OpsTableCell>
            <OpsTableCell className="hidden sm:table-cell" />
          </OpsTableRow>
        </OpsTableFooter>
      ) : null}
    </OpsDataTable>
  );
};

"use client";

import { FinancialEmployeePaymentRow } from "@/components/ops/financial/financial-employee-payment-row";
import {
  employeePaymentInitialSort,
  employeePaymentSearchFields,
  employeePaymentSortAccessors,
  sumRecordedAmounts,
} from "@/components/ops/financial/financial-table-queries";
import { formatPayrollMoney, toPayrollNumber } from "@/components/ops/payroll/payroll-utils";
import {
  OpsDataTable,
  OpsSortableHead,
  OpsTableEmptyRow,
  OpsTableHead,
  OpsTableHeader,
  OpsTablePagination,
  OpsTableRow,
  OpsTableSkeletonRows,
  useOpsTableState,
} from "@/components/ops/shared";
import type { OpsEmployee, OpsEmployeePayment } from "@/components/ops/types";
import { TableBody } from "@/components/ui/table";

export const FinancialEmployeePaymentsTable = ({
  caption,
  employees,
  isLoading,
  onClearQuery,
  onVoid,
  payments,
  query,
  resetKey,
  showStatus,
}: {
  caption: string;
  employees: OpsEmployee[];
  isLoading: boolean;
  onClearQuery: () => void;
  onVoid: (paymentId: string) => Promise<void>;
  payments: OpsEmployeePayment[];
  query: string;
  resetKey: string;
  showStatus: boolean;
}) => {
  const table = useOpsTableState({
    getSearchFields: employeePaymentSearchFields,
    initialSort: employeePaymentInitialSort,
    query,
    resetKey,
    rows: payments,
    sortAccessors: employeePaymentSortAccessors,
  });
  const columnCount = showStatus ? 7 : 6;
  const recordedTotal = sumRecordedAmounts(table.rows, toPayrollNumber);

  return (
    <OpsDataTable
      caption={caption}
      footer={
        <OpsTablePagination
          label="Páginas de pagos registrados"
          page={table}
          summary={
            isLoading
              ? null
              : `${table.total} ${table.total === 1 ? "pago" : "pagos"} · ${formatPayrollMoney(recordedTotal)} registrado`
          }
        />
      }
    >
      <OpsTableHeader>
        <OpsTableRow className="hover:bg-transparent">
          <OpsSortableHead
            className="hidden md:table-cell"
            label="Fecha"
            onSort={() => table.toggleSort("date", "desc")}
            sort={table.sort}
            sortKey="date"
          />
          <OpsSortableHead
            label="Empleada"
            onSort={() => table.toggleSort("employee")}
            sort={table.sort}
            sortKey="employee"
          />
          <OpsTableHead className="hidden lg:table-cell">Periodo</OpsTableHead>
          <OpsTableHead className="hidden xl:table-cell">Detalle</OpsTableHead>
          {showStatus ? (
            <OpsTableHead className="hidden sm:table-cell">Estado</OpsTableHead>
          ) : null}
          <OpsSortableHead
            align="right"
            className="hidden sm:table-cell"
            label="Monto"
            onSort={() => table.toggleSort("amount", "desc")}
            sort={table.sort}
            sortKey="amount"
          />
          <OpsTableHead className="hidden w-0 sm:table-cell">
            <span className="sr-only">Acciones</span>
          </OpsTableHead>
        </OpsTableRow>
      </OpsTableHeader>
      <TableBody aria-busy={isLoading || undefined}>
        {isLoading ? (
          <OpsTableSkeletonRows colSpan={columnCount} />
        ) : table.total === 0 ? (
          <OpsTableEmptyRow
            colSpan={columnCount}
            emptyDescription="Registrá un pago o cambiá el estado o la empleada filtrada."
            emptyTitle="No hay pagos para estos filtros"
            onClearQuery={onClearQuery}
            query={query}
          />
        ) : (
          table.pageRows.map((payment) => (
            <FinancialEmployeePaymentRow
              employees={employees}
              key={payment.id}
              onVoid={onVoid}
              payment={payment}
              showStatus={showStatus}
            />
          ))
        )}
      </TableBody>
    </OpsDataTable>
  );
};

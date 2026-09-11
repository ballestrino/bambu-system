"use client";

import { FinancialPaymentRow } from "@/components/ops/financial/financial-payment-row";
import {
  paymentInitialSort,
  paymentSearchFields,
  paymentSortAccessors,
  sumRecordedAmounts,
} from "@/components/ops/financial/financial-table-queries";
import { formatMoney, toMoneyNumber } from "@/components/ops/payments/payment-utils";
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
import type { OpsJobClientPayment, OpsJobListItem } from "@/components/ops/types";
import { TableBody } from "@/components/ui/table";

export const FinancialPaymentsTable = ({
  caption,
  isLoading,
  jobs,
  onClearQuery,
  onVoid,
  payments,
  query,
  resetKey,
  showStatus,
}: {
  caption: string;
  isLoading: boolean;
  jobs: OpsJobListItem[];
  onClearQuery: () => void;
  onVoid: (paymentId: string) => Promise<void>;
  payments: OpsJobClientPayment[];
  query: string;
  resetKey: string;
  showStatus: boolean;
}) => {
  const table = useOpsTableState({
    getSearchFields: paymentSearchFields,
    initialSort: paymentInitialSort,
    query,
    resetKey,
    rows: payments,
    sortAccessors: paymentSortAccessors,
  });
  const columnCount = showStatus ? 6 : 5;
  const recordedTotal = sumRecordedAmounts(table.rows, toMoneyNumber);

  return (
    <OpsDataTable
      caption={caption}
      footer={
        <OpsTablePagination
          label="Páginas de cobros"
          page={table}
          summary={
            isLoading
              ? null
              : `${table.total} ${table.total === 1 ? "cobro" : "cobros"} · ${formatMoney(recordedTotal)} registrado`
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
            label="Trabajo"
            onSort={() => table.toggleSort("job")}
            sort={table.sort}
            sortKey="job"
          />
          <OpsTableHead className="hidden lg:table-cell">Detalle</OpsTableHead>
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
            emptyDescription="Registrá un cobro o cambiá el estado o el trabajo filtrado."
            emptyTitle="No hay cobros para estos filtros"
            onClearQuery={onClearQuery}
            query={query}
          />
        ) : (
          table.pageRows.map((payment) => (
            <FinancialPaymentRow
              jobs={jobs}
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

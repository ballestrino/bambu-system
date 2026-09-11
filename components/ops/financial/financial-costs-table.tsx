"use client";

import { formatCostMoney, toCostNumber } from "@/components/ops/costs/cost-utils";
import { FinancialCostRow } from "@/components/ops/financial/financial-cost-row";
import {
  costInitialSort,
  costSearchFields,
  costSortAccessors,
  sumRecordedAmounts,
} from "@/components/ops/financial/financial-table-queries";
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
import type {
  OpsEmployee,
  OpsJobListItem,
  OpsOperationalCost,
  OpsOperationalCostCategory,
} from "@/components/ops/types";
import { TableBody } from "@/components/ui/table";

export const FinancialCostsTable = ({
  caption,
  categories,
  costs,
  employees,
  isLoading,
  jobs,
  onClearQuery,
  onVoid,
  query,
  resetKey,
  showStatus,
}: {
  caption: string;
  categories: OpsOperationalCostCategory[];
  costs: OpsOperationalCost[];
  employees: OpsEmployee[];
  isLoading: boolean;
  jobs: OpsJobListItem[];
  onClearQuery: () => void;
  onVoid: (costId: string) => Promise<void>;
  query: string;
  resetKey: string;
  showStatus: boolean;
}) => {
  const table = useOpsTableState({
    getSearchFields: costSearchFields,
    initialSort: costInitialSort,
    query,
    resetKey,
    rows: costs,
    sortAccessors: costSortAccessors,
  });
  const columnCount = showStatus ? 7 : 6;
  const recordedTotal = sumRecordedAmounts(table.rows, toCostNumber);

  return (
    <OpsDataTable
      caption={caption}
      footer={
        <OpsTablePagination
          label="Páginas de costes"
          page={table}
          summary={
            isLoading
              ? null
              : `${table.total} ${table.total === 1 ? "coste" : "costes"} · ${formatCostMoney(recordedTotal)} registrado`
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
            label="Categoría"
            onSort={() => table.toggleSort("category")}
            sort={table.sort}
            sortKey="category"
          />
          <OpsTableHead className="hidden md:table-cell">Trabajo / Empleada</OpsTableHead>
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
            emptyDescription="Registrá BPS, taxi, bus u otros gastos para ver la ganancia real."
            emptyTitle="No hay costes para estos filtros"
            onClearQuery={onClearQuery}
            query={query}
          />
        ) : (
          table.pageRows.map((cost) => (
            <FinancialCostRow
              categories={categories}
              cost={cost}
              employees={employees}
              jobs={jobs}
              key={cost.id}
              onVoid={onVoid}
              showStatus={showStatus}
            />
          ))
        )}
      </TableBody>
    </OpsDataTable>
  );
};

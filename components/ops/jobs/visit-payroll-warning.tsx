"use client";

import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";

import { useVisitPaidEmployees } from "@/components/ops/hooks/useVisitPaidEmployees";
import type { OpsOccurrence } from "@/components/ops/types";
import {
  formatVisitPayrollWarning,
  getVisitPayrollImpact,
} from "@/components/ops/visit-payroll-impact";

// Removing a done visit takes its hours off payroll. Mounted inside the
// confirmation, so the payments are only read when it opens.
export const VisitPayrollWarning = ({ occurrence }: { occurrence: OpsOccurrence }) => {
  const impact = useMemo(() => getVisitPayrollImpact(occurrence), [occurrence]);
  const { error, isLoading, paidEmployeeIds } = useVisitPaidEmployees(impact);

  if (!impact) return null;

  return (
    <div
      role="note"
      className="flex gap-2 rounded-[var(--ops-radius-control)] border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
    >
      <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        {formatVisitPayrollWarning(impact, paidEmployeeIds).map((line) => (
          <p key={line}>{line}</p>
        ))}
        {isLoading ? <p className="text-xs opacity-80">Revisando pagos cargados…</p> : null}
        {error ? (
          <p className="text-xs opacity-80">No se pudo revisar si ese mes ya tiene pagos.</p>
        ) : null}
      </div>
    </div>
  );
};

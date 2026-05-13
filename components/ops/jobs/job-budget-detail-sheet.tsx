"use client";

import { BudgetDetails } from "@/components/budgets/budget-details/BudgetDetails";
import { calculateBudgetTotals } from "@/lib/budget-calculations";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";
import { formatDate, formatDateTime } from "@/components/ops/utils";

const SummaryItem = ({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) => (
  <div className={className ?? "rounded-xl border border-black/5 bg-white p-3 text-sm dark:bg-background/70"}>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 break-words font-medium text-[#18251D] dark:text-[#EAF5EC]">{value || "-"}</p>
  </div>
);

export const mapSnapshotOptionToBudgetValues = (option: Record<string, unknown>) => ({
  company_contribution: Number(option.companyContribution ?? 0),
  company_enabled: Number(option.companyContribution ?? 0) > 0,
  employees: Number(option.employees ?? 1),
  has_products: Boolean(option.hasProducts),
  hours_per_visit: Number(option.hoursPerVisit ?? 0),
  incidence_contribution: Number(option.incidenceContribution ?? 0),
  incidence_enabled: Number(option.incidenceContribution ?? 0) > 0,
  iva: Number(option.iva ?? 0),
  nominal_hour: Number(option.nominalHour ?? 0),
  nominal_salary: Number(option.nominalSalary ?? 0),
  personal_contribution: Number(option.personalContribution ?? 0),
  personal_enabled: Number(option.personalContribution ?? 0) > 0,
  price: Number(option.price ?? 0),
  products_iva: Number(option.productsIva ?? 0),
  products_price: Number(option.productsPrice ?? 0),
  products_revenue_percent: Number(option.productsRevenuePercent ?? 0),
  revenue_percent: Number(option.revenuePercent ?? 0),
  transportation_cost: Number(option.transportationCost ?? 0),
  visit_type:
    option.visitType === "month" || option.visitType === "days" ? option.visitType : "week",
  visits: Number(option.visits ?? 0),
}) satisfies Partial<BudgetFormValues> & { has_products?: boolean };

export const getSnapshotNetPriceLabel = (option: Record<string, unknown>) => {
  const values = mapSnapshotOptionToBudgetValues(option);
  const totals = calculateBudgetTotals(values);
  const netPrice = values.has_products ? totals.totalPreTaxWithProducts : totals.priceNoTaxService;

  return `$${netPrice.toFixed(2)}`;
};

export const JobBudgetDetailSheet = ({
  imageDate,
  job,
  servicePrice,
  snapshotBudget,
  snapshotOption,
  teamAndHours,
}: {
  imageDate: string;
  job: {
    archivedAt: Date | null;
    operationalNotes?: string | null;
    serviceAddress?: string | null;
    serviceLocation?: string | null;
    sourceBudget?: { name: string; slug: string } | null;
    createdAt: Date;
    updatedAt: Date;
  };
  servicePrice: string;
  snapshotBudget: Record<string, unknown> | null;
  snapshotOption: Record<string, unknown> | null;
  teamAndHours: string;
}) => (
  <div className="mt-6 grid gap-4 pb-6">
    <div className="grid gap-3 sm:grid-cols-2">
      <SummaryItem label="Direccion" value={job.serviceAddress || "Sin direccion"} />
      <SummaryItem label="Referencia" value={job.serviceLocation || "Sin referencia"} />
    </div>

    <div className="rounded-xl border border-black/5 bg-white p-4 dark:bg-background/70">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Notas operativas
      </p>
      <p className="mt-2 text-sm font-medium text-[#18251D] dark:text-[#EAF5EC]">
        {job.operationalNotes || "Sin notas"}
      </p>
    </div>

    <div className="rounded-xl border border-[#C58A2A]/20 bg-[#FFF8EA] p-4 text-sm dark:bg-[#C58A2A]/10">
      <div className="space-y-1 border-b border-[#C58A2A]/15 pb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8D6420] dark:text-[#F5D28C]">
          Presupuesto vinculado
        </p>
        <p className="text-base font-semibold text-[#18251D] dark:text-[#EAF5EC]">
          {job.sourceBudget?.name || snapshotBudget?.name?.toString() || "Sin vinculo"}
        </p>
        <p className="text-sm text-muted-foreground">
          {(job.sourceBudget?.slug || snapshotBudget?.slug?.toString() || "Sin slug")} · {imageDate}
        </p>
      </div>

      <div className="mt-3 space-y-3">
        <SummaryItem className="rounded-xl border border-[#C58A2A]/15 bg-white/85 p-3 text-sm dark:bg-background/60" label="Precio del servicio" value={servicePrice} />
        <SummaryItem className="rounded-xl border border-[#C58A2A]/15 bg-white/85 p-3 text-sm dark:bg-background/60" label="Horas y equipo" value={teamAndHours} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <SummaryItem className="rounded-xl border border-[#C58A2A]/15 bg-white/85 p-3 text-sm dark:bg-background/60" label="Creado" value={formatDateTime(job.createdAt)} />
        <SummaryItem className="rounded-xl border border-[#C58A2A]/15 bg-white/85 p-3 text-sm dark:bg-background/60" label="Actualizado" value={formatDateTime(job.updatedAt)} />
        <SummaryItem className="rounded-xl border border-[#C58A2A]/15 bg-white/85 p-3 text-sm dark:bg-background/60" label="Archivado" value={formatDate(job.archivedAt)} />
      </div>
    </div>

    {snapshotOption ? (
      <BudgetDetails
        option={mapSnapshotOptionToBudgetValues(snapshotOption)}
        title="Detalle de la opción vinculada"
      />
    ) : (
      <div className="rounded-xl border border-dashed border-black/10 bg-white p-4 text-sm text-muted-foreground dark:bg-background/70">
        Este trabajo solo conserva la referencia del presupuesto base. No hay una opción vinculada con desglose financiero completo.
      </div>
    )}
  </div>
);

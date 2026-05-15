"use client";

import { ReceiptText } from "lucide-react";

import {
  JobBudgetDetailSheet,
} from "@/components/ops/jobs/job-budget-detail-sheet";
import { JobBudgetTaxModeToggle } from "@/components/ops/jobs/job-budget-tax-mode-toggle";
import { useJobMutations } from "@/components/ops/hooks/useJobMutations";
import { formatDateTime } from "@/components/ops/utils";
import type { OpsJobDetail } from "@/components/ops/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  formatJobBudgetPrice,
  getJobBudgetPrice,
  getJobBudgetTaxModeLabel,
} from "@/lib/ops/job-budget-pricing";

const readSnapshot = (snapshot: OpsJobDetail["budgetSnapshot"]) => {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  return snapshot as Record<string, unknown>;
};

export const JobSummaryCard = ({ job }: { job: OpsJobDetail }) => {
  const { updateJobAsync, isUpdating } = useJobMutations();
  const snapshot = readSnapshot(job.budgetSnapshot);
  const snapshotBudget =
    snapshot?.budget && typeof snapshot.budget === "object" && !Array.isArray(snapshot.budget)
      ? (snapshot.budget as Record<string, unknown>)
      : null;
  const snapshotOption =
    snapshot?.option && typeof snapshot.option === "object" && !Array.isArray(snapshot.option)
      ? (snapshot.option as Record<string, unknown>)
      : null;
  const servicePrice = getJobBudgetPrice(job);
  const servicePriceLabel = formatJobBudgetPrice(servicePrice);
  const taxModeLabel = getJobBudgetTaxModeLabel(job.budgetIncludesIva);
  const teamAndHours = snapshotOption
    ? `${snapshotOption.hoursPerVisit ?? "-"} hs por visita / ${snapshotOption.employees ?? "-"} persona(s)`
    : "-";
  const imageDate =
    typeof snapshot?.capturedAt === "string"
      ? formatDateTime(snapshot.capturedAt)
      : "Sin imagen guardada";
  const canToggleTaxMode = Boolean(snapshotOption || job.sourceBudgetOption);

  return (
    <Card className="rounded-2xl border-0 bg-white/90 shadow-sm ring-1 ring-black/5 dark:bg-background/70">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle>Imagen del presupuesto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Resumen comercial y operativo que dio origen al trabajo.
            </p>
          </div>
          <div className="flex flex-row items-center gap-3">
            <JobBudgetTaxModeToggle
              disabled={!canToggleTaxMode}
              isPending={isUpdating}
              value={job.budgetIncludesIva}
              onValueChange={async (budgetIncludesIva) => {
                await updateJobAsync({
                  jobId: job.id,
                  values: { budgetIncludesIva },
                });
              }}
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-fit rounded-full border-black/10">
                  Ver detalle
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto px-4 sm:max-w-3xl">
                <SheetHeader>
                  <SheetTitle>Imagen del presupuesto</SheetTitle>
                  <SheetDescription>
                    Detalle del contexto comercial y operativo vinculado al trabajo.
                  </SheetDescription>
                </SheetHeader>
                <JobBudgetDetailSheet
                  budgetIncludesIva={job.budgetIncludesIva}
                  imageDate={imageDate}
                  job={job}
                  servicePrice={servicePrice}
                  snapshotBudget={snapshotBudget}
                  snapshotOption={snapshotOption}
                  teamAndHours={teamAndHours}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)_auto]">
          <div className="rounded-xl border border-black/5 bg-white p-4 dark:bg-background/70">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Servicio
            </p>
            <p className="mt-1 text-sm font-medium text-[#18251D] dark:text-[#EAF5EC]">
              {job.description || "Sin descripcion"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {job.serviceAddress || "Sin direccion"}
              {job.serviceLocation ? ` · ${job.serviceLocation}` : ""}
            </p>
          </div>
          <div className="rounded-xl border border-[#C58A2A]/20 bg-[#FFF8EA] p-4 dark:bg-[#C58A2A]/10">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/90 text-[#8D6420] ring-1 ring-[#C58A2A]/20 dark:bg-background/60">
                <ReceiptText className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[#8D6420] dark:text-[#F5D28C]">
                  Presupuesto vinculado
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[#18251D] dark:text-[#EAF5EC]">
                  {job.sourceBudget?.name || "Sin vinculo"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Precio del servicio ({taxModeLabel.toLowerCase()}): {servicePriceLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-black/5 bg-white p-3 text-sm dark:bg-background/70">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Imagen
            </p>
            <p className="mt-1 break-words font-medium text-[#18251D] dark:text-[#EAF5EC]">
              {imageDate}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

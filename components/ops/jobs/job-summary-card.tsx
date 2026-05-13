"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/components/ops/utils";
import type { OpsJobDetail } from "@/components/ops/types";

const SummaryItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="rounded-xl border border-[#53985E]/10 bg-[#F8FBF8] p-3 text-sm dark:bg-[#132016]">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 break-words font-medium text-[#18251D] dark:text-[#EAF5EC]">
      {value || "-"}
    </p>
  </div>
);

const readSnapshot = (snapshot: OpsJobDetail["budgetSnapshot"]) => {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  return snapshot as Record<string, unknown>;
};

export const JobSummaryCard = ({ job }: { job: OpsJobDetail }) => {
  const snapshot = readSnapshot(job.budgetSnapshot);
  const snapshotOption =
    snapshot?.option && typeof snapshot.option === "object" && !Array.isArray(snapshot.option)
      ? (snapshot.option as Record<string, unknown>)
      : null;
  const priceAndVisits = snapshotOption
    ? `$${snapshotOption.price ?? "-"} / ${snapshotOption.visits ?? "-"} visitas`
    : "Sin opcion";
  const teamAndHours = snapshotOption
    ? `${snapshotOption.hoursPerVisit ?? "-"} hs por visita / ${snapshotOption.employees ?? "-"} persona(s)`
    : "-";

  return (
    <Card className="rounded-2xl border-0 bg-white/90 shadow-sm ring-1 ring-black/5 dark:bg-background/70">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle>Snapshot operativo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Datos administrativos y referencia del presupuesto que alimenta esta operacion.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem label="Descripcion" value={job.description || "Sin descripcion"} />
          <SummaryItem label="Notas operativas" value={job.operationalNotes || "Sin notas"} />
          <SummaryItem label="Direccion" value={job.serviceAddress || "Sin direccion"} />
          <SummaryItem label="Referencia" value={job.serviceLocation || "Sin referencia"} />
        </div>
        <div className="space-y-3 rounded-xl border border-[#C58A2A]/20 bg-[#FFF8EA] p-4 text-sm dark:bg-[#C58A2A]/10">
          <SummaryItem label="Presupuesto base" value={job.sourceBudget?.name || "Sin vinculo"} />
          <SummaryItem label="Slug fuente" value={job.sourceBudget?.slug || "-"} />
          <SummaryItem
            label="Snapshot"
            value={typeof snapshot?.capturedAt === "string" ? formatDateTime(snapshot.capturedAt) : "Sin snapshot"}
          />
          <SummaryItem label="Precio y visitas" value={priceAndVisits} />
          <SummaryItem label="Horas y equipo" value={teamAndHours} />
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryItem label="Creado" value={formatDateTime(job.createdAt)} />
            <SummaryItem label="Actualizado" value={formatDateTime(job.updatedAt)} />
            <SummaryItem label="Archivado" value={formatDate(job.archivedAt)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

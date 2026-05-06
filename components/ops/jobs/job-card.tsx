"use client";

import Link from "next/link";

import DeleteDialog from "@/components/ui/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/ops/jobs/status-badges";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import { formatDateTime } from "@/components/ops/utils";
import type { OpsJobListItem } from "@/components/ops/types";

export const JobCard = ({
  job,
  onArchive,
}: {
  job: OpsJobListItem;
  onArchive: (jobId: string) => Promise<void>;
}) => (
  <Card className="h-full border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
    <CardHeader className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-lg">{job.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {job.serviceLocation || job.serviceAddress || "Sin ubicación cargada"}
          </p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      {job.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
      ) : null}
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-2 text-sm text-muted-foreground">
        <p>Actualizado: {formatDateTime(job.updatedAt)}</p>
        <p>Presupuesto: {job.sourceBudget?.name ?? "Sin vínculo"}</p>
        <p>Opción: {job.sourceBudgetOption ? `$${job.sourceBudgetOption.price}` : "Sin opción"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/dashboard/jobs/${job.id}`}>Ver detalle</Link>
        </Button>
        <JobFormDialog job={job} />
        <DeleteDialog
          title="Archivar trabajo"
          description="El trabajo se ocultará del listado principal pero conservará su historial."
          deleteButtonText="Archivar"
          deleteButtonVariant="default"
          onConfirm={async () => {
            await onArchive(job.id);
          }}
          trigger={
            <Button variant="outline" size="sm">
              Archivar
            </Button>
          }
        />
      </div>
    </CardContent>
  </Card>
);

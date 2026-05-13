"use client";

import Link from "next/link";
import { BriefcaseBusiness, CalendarClock, DollarSign, MapPin } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import DeleteDialog from "@/components/ui/delete-dialog";
import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/ops/jobs/status-badges";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import { OpsRecordItem } from "@/components/ops/shared";
import { formatDateTime } from "@/components/ops/utils";
import type { OpsJobListItem } from "@/components/ops/types";

export const JobCard = ({
  job,
  onArchive,
}: {
  job: OpsJobListItem;
  onArchive: (jobId: string) => Promise<void>;
}) => {
  const location = job.serviceLocation || job.serviceAddress || "Sin ubicación cargada";
  const option = job.sourceBudgetOption ? `$${job.sourceBudgetOption.price}` : "Sin opción";

  return (
    <OpsRecordItem
      leading={
        <div className="hidden rounded-md border border-[#53985E]/20 bg-[#EAF5EC] p-2 text-[#244C2D] md:flex">
          <BriefcaseBusiness className="h-5 w-5" />
        </div>
      }
      title={job.name}
      subtitle={
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </span>
      }
      status={<JobStatusBadge status={job.status} />}
      description={job.description}
      meta={
        <>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            Actualizado: {formatDateTime(job.updatedAt)}
          </span>
          <span>Presupuesto: {job.sourceBudget?.name ?? "Sin vínculo"}</span>
          <span className="inline-flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            Opción: {option}
          </span>
        </>
      }
      actions={
        <>
          <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
            <Link href={`/dashboard/jobs/${job.id}`}>Detalle</Link>
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
        </>
      }
    />
  );
};

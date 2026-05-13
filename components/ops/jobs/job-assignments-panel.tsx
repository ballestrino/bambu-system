"use client";

import Link from "next/link";
import { Clock3, UsersRound } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { JobAssignmentDialog } from "@/components/ops/jobs/job-assignment-dialog";
import { OpsDetailRow, OpsSection } from "@/components/ops/shared";
import type { OpsJobEmployeeAssignment } from "@/components/ops/types";
import { formatDateTime } from "@/components/ops/utils";
import DeleteDialog from "@/components/ui/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const JobAssignmentsPanel = ({
  jobId,
  assignments,
  onArchive,
}: {
  jobId: string;
  assignments: OpsJobEmployeeAssignment[];
  onArchive: (assignmentId: string) => Promise<void>;
}) => (
  <OpsSection
    actions={<JobAssignmentDialog jobId={jobId} />}
    description="Base operativa para poblar recorridos y sostener la agenda del trabajo."
    title="Equipo asignado"
  >
    <div className="space-y-3">
      {assignments.length ? (
        assignments.map((assignment) => (
          <OpsDetailRow
            key={assignment.id}
            actions={
              <>
                <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                  <Link href={`/dashboard/employees/${assignment.employeeId}`}>Ver empleado</Link>
                </Button>
                <JobAssignmentDialog jobId={jobId} assignment={assignment} />
                <DeleteDialog
                  title="Archivar asignación"
                  description="El empleado dejará de estar asignado a este trabajo."
                  deleteButtonText="Archivar"
                  deleteButtonVariant="default"
                  onConfirm={async () => {
                    await onArchive(assignment.id);
                  }}
                  trigger={<Button size="sm" variant="outline" className={dashboardSecondaryActionClass}>Archivar</Button>}
                />
              </>
            }
          >
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#EAF5EC] text-[#244C2D] ring-1 ring-[#53985E]/15">
                  <UsersRound className="h-4 w-4" />
                </span>
                <p className="font-medium">{assignment.employee.name}</p>
                {assignment.roleLabel ? <Badge variant="outline">{assignment.roleLabel}</Badge> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4 text-[#53985E]" />
                <span>
                  Desde {formatDateTime(assignment.assignedFrom)}
                  {assignment.assignedTo ? ` hasta ${formatDateTime(assignment.assignedTo)}` : ""}
                </span>
              </div>
            </div>
          </OpsDetailRow>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay empleados asignados a este trabajo.
        </p>
      )}
    </div>
  </OpsSection>
);

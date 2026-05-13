"use client";

import Link from "next/link";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { JobAssignmentDialog } from "@/components/ops/jobs/job-assignment-dialog";
import type { OpsJobEmployeeAssignment } from "@/components/ops/types";
import { formatDateTime } from "@/components/ops/utils";
import DeleteDialog from "@/components/ui/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const JobAssignmentsPanel = ({
  jobId,
  assignments,
  onArchive,
}: {
  jobId: string;
  assignments: OpsJobEmployeeAssignment[];
  onArchive: (assignmentId: string) => Promise<void>;
}) => (
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="space-y-1">
        <CardTitle>Empleados asignados</CardTitle>
        <p className="text-xs text-muted-foreground">
          Base operativa para futuras ocurrencias automáticas.
        </p>
      </div>
      <JobAssignmentDialog jobId={jobId} />
    </CardHeader>
    <CardContent className="space-y-3">
      {assignments.length ? (
        assignments.map((assignment) => (
          <div key={assignment.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{assignment.employee.name}</p>
                {assignment.roleLabel ? <Badge variant="outline">{assignment.roleLabel}</Badge> : null}
              </div>
              <p className="text-muted-foreground">
                Desde {formatDateTime(assignment.assignedFrom)}
                {assignment.assignedTo ? ` hasta ${formatDateTime(assignment.assignedTo)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
              />
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no hay empleados asignados a este trabajo.
        </p>
      )}
    </CardContent>
  </Card>
);

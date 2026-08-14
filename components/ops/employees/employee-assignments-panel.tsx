"use client";

import Link from "next/link";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import type { OpsJobEmployeeAssignment } from "@/components/ops/types";
import { formatDateTime } from "@/components/ops/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EmployeeAssignmentsPanel = ({
  assignments,
}: {
  assignments: OpsJobEmployeeAssignment[];
}) => {
  const activeAssignments = assignments.filter((assignment) => !assignment.archivedAt);

  return (
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-[#1A211A] dark:ring-white/10">
      <CardHeader>
        <CardTitle>Trabajos asignados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.length ? (
          assignments.map((assignment) => (
            <div key={assignment.id} className="flex flex-col gap-3 rounded-lg border border-black/5 bg-white p-4 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-[#242D23]">
              <div className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{assignment.job.name}</p>
                  <Badge variant={assignment.archivedAt ? "secondary" : "default"}>
                    {assignment.archivedAt ? "Histórica" : "Activa"}
                  </Badge>
                  {assignment.roleLabel ? <Badge variant="outline">{assignment.roleLabel}</Badge> : null}
                </div>
                <p className="text-muted-foreground">
                  Desde {formatDateTime(assignment.assignedFrom)}
                  {assignment.assignedTo ? ` hasta ${formatDateTime(assignment.assignedTo)}` : ""}
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                <Link href={`/dashboard/jobs/${assignment.jobId}`}>Ver trabajo</Link>
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no hay trabajos asignados a este empleado.
          </p>
        )}
        {activeAssignments.length ? (
          <p className="text-xs text-muted-foreground">
            Estas asignaciones serán la base para poblar ocurrencias automáticas futuras.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

import Link from "next/link";

import { formatMoney } from "@/components/ops/payments/payment-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AttributionRow = {
  amount: number;
  employeeId: string;
  employeeName: string;
  hours: number;
};

export const RevenueAttributionPanel = ({
  rows,
  unassignedJobs,
  unassignedTotal,
}: {
  rows: AttributionRow[];
  unassignedJobs: { amount: number; jobId: string; jobName: string }[];
  unassignedTotal: number;
}) => (
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
    <CardHeader>
      <CardTitle>Dinero generado por empleado</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.employeeId} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-medium">{row.employeeName}</p>
              <p className="text-sm text-muted-foreground">{row.hours.toFixed(2)} hs aprobadas por visitas realizadas</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold">{formatMoney(row.amount)}</p>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/employees/${row.employeeId}`}>Empleado</Link>
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay horas reales completadas para atribuir cobros en este rango.
        </p>
      )}
      {unassignedTotal > 0 ? (
        <div className="rounded-lg border border-dashed p-4">
          <p className="font-medium">Sin atribuir: {formatMoney(unassignedTotal)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cobros registrados en trabajos sin horas reales completadas en el rango.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unassignedJobs.map((job) => (
              <Button key={job.jobId} asChild size="sm" variant="outline">
                <Link href={`/dashboard/jobs/${job.jobId}`}>{job.jobName}</Link>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </CardContent>
  </Card>
);

import Link from "next/link";

import { TRANSPORTATION_PAY_PER_VISIT } from "@/components/ops/compensation-utils";
import { formatMoney } from "@/components/ops/payments/payment-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AttributionRow = {
  amount: number | null;
  employeeId: string;
  employeeName: string;
  hourlyRate: number | null;
  hours: number;
  laborAmount: number;
  transportationAmount: number;
  visits: number;
};

export const EmployeeGeneratedPayPanel = ({
  rows,
}: {
  rows: AttributionRow[];
}) => (
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-[#132016] dark:ring-white/10">
    <CardHeader>
      <CardTitle>Pago generado por empleado</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.employeeId} className="flex flex-col gap-2 rounded-lg border border-black/5 bg-white p-4 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-[#1B2A1E]">
            <div className="space-y-1">
              <p className="font-medium">{row.employeeName}</p>
              <p className="text-sm text-muted-foreground">
                {row.hours.toFixed(2)} hs reales · {row.visits}{" "}
                {row.visits === 1 ? "visita" : "visitas"}
              </p>
              <p className="text-xs text-muted-foreground">
                Tarifa:{" "}
                {row.hourlyRate === null ? "pendiente" : `${formatMoney(row.hourlyRate)} / h`} · Boleto:{" "}
                {formatMoney(TRANSPORTATION_PAY_PER_VISIT)} / visita
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <div className="text-left md:text-right">
                <p className="font-semibold">
                  {row.amount === null ? "Tarifa pendiente" : formatMoney(row.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Horas:{" "}
                  {row.hourlyRate === null ? "-" : formatMoney(row.laborAmount)} · Boletos:{" "}
                  {formatMoney(row.transportationAmount)}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/employees/${row.employeeId}`}>Empleado</Link>
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay visitas realizadas con equipo asignado en este rango.
        </p>
      )}
    </CardContent>
  </Card>
);

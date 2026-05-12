import { formatMoney } from "@/components/ops/payments/payment-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PaymentsSummary = ({
  recordedCount,
  recordedTotal,
  voidedCount,
  voidedTotal,
}: {
  recordedCount: number;
  recordedTotal: number;
  voidedCount: number;
  voidedTotal: number;
}) => (
  <div className="grid gap-4 md:grid-cols-4">
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader><CardTitle className="text-sm">Cobrado registrado</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{formatMoney(recordedTotal)}</CardContent>
    </Card>
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader><CardTitle className="text-sm">Cobros registrados</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{recordedCount}</CardContent>
    </Card>
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader><CardTitle className="text-sm">Anulado</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{formatMoney(voidedTotal)}</CardContent>
    </Card>
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader><CardTitle className="text-sm">Cobros anulados</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{voidedCount}</CardContent>
    </Card>
  </div>
);

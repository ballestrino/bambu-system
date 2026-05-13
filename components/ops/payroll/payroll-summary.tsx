import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PayrollSummary = ({
  balanceTotal,
  recordedTotal,
  suggestedTotal,
  voidedTotal,
}: {
  balanceTotal: number;
  recordedTotal: number;
  suggestedTotal: number;
  voidedTotal: number;
}) => (
  <div className="grid gap-4 md:grid-cols-4">
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader><CardTitle className="text-sm">Sugerido</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{formatPayrollMoney(suggestedTotal)}</CardContent>
    </Card>
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader><CardTitle className="text-sm">Pagado</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{formatPayrollMoney(recordedTotal)}</CardContent>
    </Card>
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader><CardTitle className="text-sm">Saldo</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{formatPayrollMoney(balanceTotal)}</CardContent>
    </Card>
    <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
      <CardHeader><CardTitle className="text-sm">Anulado</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{formatPayrollMoney(voidedTotal)}</CardContent>
    </Card>
  </div>
);

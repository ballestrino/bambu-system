import type { OfficialBudgetOptionDto } from "@/components/official-budgets/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("es-UY", { style: "currency", currency }).format(value);

const cadence = { days: "Por día", week: "Semanal", month: "Mensual" } as const;

export function OfficialOptionBreakdown({
  option,
  currency,
}: {
  option: OfficialBudgetOptionDto;
  currency: string;
}) {
  const rows = [
    ["Frecuencia", `${option.visits} · ${cadence[option.visitType]}`],
    ["Horas por visita", option.hoursPerVisit],
    ["Empleados", option.employees],
    ["Visitas mensuales efectivas", option.effectiveMonthlyVisits],
    ["Carga mensual estimada", `${option.monthlyWorkload} h`],
    ["Factor semanal", option.visitType === "week" ? option.weeklyMultiplier : "No aplica"],
    ["Hora nominal", money(option.nominalHour, currency)],
    ["Salario nominal", money(option.nominalSalary, currency)],
    ["Transporte", money(option.transportationCost, currency)],
    ["Costo de productos", money(option.productsCost, currency)],
    ["IVA productos", `${option.productsIvaPercent}%`],
    ["Margen productos", `${option.productsRevenuePercent}%`],
    ["Margen servicio", `${option.serviceRevenuePercent}%`],
    ["Aportes personales", `${option.personalContributionPercent}%`],
    ["Aportes patronales", `${option.companyContributionPercent}%`],
    ["Incidencias", `${option.incidenceContributionPercent}%`],
    ["Costo laboral calculado", money(option.calculatedLaborCost, currency)],
    ["Aportes personales calculados", money(option.calculatedPersonalContribution, currency)],
    ["Incidencias calculadas", money(option.calculatedIncidenceContribution, currency)],
    ["Aportes patronales calculados", money(option.calculatedCompanyContribution, currency)],
    ["Contribuciones calculadas", money(option.calculatedContributionsTotal, currency)],
    ["Base servicio calculada", money(option.calculatedServiceCostBasis, currency)],
    ["Ganancia servicio calculada", money(option.calculatedServiceRevenue, currency)],
    ["Ganancia productos calculada", money(option.calculatedProductsRevenue, currency)],
    ["Neto productos calculado", money(option.calculatedProductsNetPrice, currency)],
    ["Neto total calculado", money(option.calculatedNetPrice, currency)],
    ["IVA calculado", money(option.calculatedIvaAmount, currency)],
    ["Final calculado", money(option.calculatedFinalPrice, currency)],
  ] as const;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Opción {option.position + 1}</CardTitle>
        <Badge variant="secondary">{option.hasProducts ? "Con productos" : "Sin productos"}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b py-1"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>)}
        </div>
        <div className="grid gap-3 rounded-lg bg-[#EAF5EC] p-4 text-sm text-[#244C2D] sm:grid-cols-4 dark:bg-[#2B3A28] dark:text-[#E1EAD3]">
          <div><p className="opacity-70">Neto</p><p className="font-bold">{money(option.netPrice, currency)}</p></div>
          <div><p className="opacity-70">IVA ({option.ivaPercent}%)</p><p className="font-bold">{money(option.ivaAmount, currency)}</p></div>
          <div><p className="opacity-70">Final oficial</p><p className="font-bold">{money(option.finalPrice, currency)}</p></div>
          <div><p className="opacity-70">Hora neta</p><p className="font-bold">{money(option.hourlyPrice, currency)}</p></div>
        </div>
        <p className="text-xs text-muted-foreground">El precio final almacenado es el valor oficial. La carga mensual y los valores recalculados son estimaciones auditables; para frecuencia semanal se aplica el factor 4,32.</p>
      </CardContent>
    </Card>
  );
}

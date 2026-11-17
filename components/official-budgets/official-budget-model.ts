import {
  formatVisits,
  VISIT_TYPE_LABELS,
  withIvaSegment,
  type DetailContributions,
  type DetailFact,
  type DetailOption,
  type DetailStats,
} from "@/components/budgets/budget-details/budget-detail-model";
import { percentLabel } from "@/components/budgets/budget-details/budget-detail-facts";
import {
  formatBudgetMoney,
  formatBudgetNumber,
  type BudgetSummaryRow,
} from "@/components/budgets/create-budget/budget-summary-model";
import type { OfficialBudgetOptionDto, OfficialBudgetRowOptionDto } from "@/components/official-budgets/types";

// El oficial se muestra con lo que guardó su versión: el precio es el oficial
// (autoritativo) y los costos son los calculados al publicar. Los extras y el
// BSE no tienen columna propia: salen de restar lo que sí se guardó.

type PriceOption = Pick<OfficialBudgetRowOptionDto, "hasProducts" | "productsCost">;

export const pickOfficialOptions = <T extends PriceOption>(options: T[]) => {
  const base = options.find((option) => !option.hasProducts) ?? null;
  const products = options.find((option) => option.hasProducts && option.productsCost > 0) ?? null;
  return { base, products, first: base ?? products ?? options[0] ?? null };
};

const costsOf = (option: OfficialBudgetOptionDto) => {
  const labor = option.calculatedLaborCost;
  const contributions = option.calculatedContributionsTotal;
  const transport = option.transportationCost;
  const extras = Math.max(0, option.calculatedServiceCostBasis - labor - contributions - transport);
  const bse = Math.max(0, contributions - option.calculatedCompanyContribution - option.calculatedIncidenceContribution);
  return { labor, contributions, transport, extras, bse };
};

const row = (key: string, label: string, value: string, tone: BudgetSummaryRow["tone"] = "normal", hint?: string): BudgetSummaryRow => ({
  key,
  label,
  value,
  tone,
  hint,
});

export const buildOfficialDetailOption = (option: OfficialBudgetOptionDto, withIva: boolean): DetailOption => {
  const { labor, contributions, transport, extras } = costsOf(option);
  const products = option.hasProducts ? option.productsCost : 0;
  const productGain = option.hasProducts ? option.calculatedProductsRevenue : 0;
  const gain = option.calculatedServiceRevenue;
  const costBase = option.calculatedServiceCostBasis + products;
  const rounding = option.netPrice - (costBase + gain + productGain);
  const m = formatBudgetMoney;

  const rows = [
    row("labor", "Mano de obra", m(labor), "normal", `${formatBudgetNumber(option.monthlyWorkload)} hs`),
    row("contributions", "Aportes y cargas", m(contributions)),
    row("transport", "Transporte", m(transport)),
  ];
  if (extras >= 1) rows.push(row("extras", "Extras", m(extras), "normal", "extra"));
  if (products > 0) rows.push(row("products", "Productos", m(products)));
  rows.push(row("cost", "Costo base", m(costBase), "total"));
  rows.push(row("gain", products > 0 ? "Ganancia del servicio" : "Ganancia", `+ ${m(gain)}`, "gain", `${formatBudgetNumber(option.serviceRevenuePercent)}%`));
  if (productGain > 0) rows.push(row("product-gain", "Ganancia de productos", `+ ${m(productGain)}`, "gain", `${formatBudgetNumber(option.productsRevenuePercent)}%`));
  if (Math.abs(rounding) >= 1) rows.push(row("rounding", "Ajuste al precio oficial", `${rounding > 0 ? "+" : "−"} ${m(Math.abs(rounding))}`));
  rows.push(row("price", "Precio sin IVA", m(option.netPrice), "total"));
  rows.push(row("iva", "IVA", m(option.ivaAmount), "normal", `${formatBudgetNumber(option.ivaPercent)}%`));
  rows.push(row("final", "Precio con IVA", m(option.finalPrice), "final"));

  const segments = [
    { amount: labor, colorClass: "bg-ops-bamboo-strong", key: "labor", label: "Mano de obra", pct: "" },
    { amount: contributions, colorClass: "bg-ops-bamboo", key: "contributions", label: "Aportes", pct: "" },
    { amount: transport + extras, colorClass: "bg-ops-amber", key: "transport", label: "Transporte y extras", pct: "" },
    { amount: products + productGain, colorClass: "bg-[#7d93b8]", key: "products", label: "Productos", pct: "" },
    { amount: gain, colorClass: "bg-[#c9e2cd] dark:bg-[#3c5038]", key: "gain", label: "Ganancia", pct: "" },
  ].filter((segment) => segment.amount > 0);
  const ivaFactor = option.netPrice > 0 ? option.finalPrice / option.netPrice : 1;

  return {
    key: option.hasProducts ? "products" : "base",
    rows,
    segments: withIvaSegment(segments, option.ivaAmount, withIva),
    price: withIva ? option.finalPrice : option.netPrice,
    hourly: withIva ? option.hourlyPrice * ivaFactor : option.hourlyPrice,
    productsCost: products,
    ivaPct: option.ivaPercent,
    totalHours: option.monthlyWorkload,
  };
};

export const officialStats = (option: OfficialBudgetOptionDto): DetailStats => ({
  visitsHint: `${formatVisits(option.visits, option.visitType)} · ${formatBudgetNumber(option.hoursPerVisit)} hs`,
  people: option.employees,
  nominalHour: option.nominalHour,
});

export const officialServiceFacts = (option: OfficialBudgetOptionDto, products: OfficialBudgetOptionDto | null): DetailFact[] => {
  const { extras } = costsOf(option);
  const productGain = products ? ` · ${formatBudgetNumber(products.productsRevenuePercent)}% productos` : "";

  return [
    { label: "Frecuencia", value: `${VISIT_TYPE_LABELS[option.visitType] ?? "Visitas"} · ${formatVisits(option.visits, option.visitType)}` },
    { label: "Horas por visita", value: `${formatBudgetNumber(option.hoursPerVisit)} hs` },
    { label: "Empleados", value: String(option.employees) },
    { label: "Hora nominal", value: formatBudgetMoney(option.nominalHour) },
    { label: "Transporte", value: `${formatBudgetMoney(option.transportationCost)} por mes` },
    { label: "Extras", value: extras >= 1 ? `${formatBudgetMoney(extras)} por mes` : "Sin extras" },
    { label: "Ganancia", value: `${formatBudgetNumber(option.serviceRevenuePercent)}% servicio${productGain}` },
  ];
};

export const officialContributions = (option: OfficialBudgetOptionDto): DetailContributions => {
  const { bse } = costsOf(option);
  const personal = option.personalContributionPercent > 0;
  const added = (percent: number) => (percent > 0 ? ({ badge: "Se suma", tone: "added" } as const) : ({ badge: "No aplica", tone: "off" } as const));

  return {
    total: option.calculatedContributionsTotal,
    rows: [
      {
        key: "personal",
        label: "Aportes personales",
        hint: `${percentLabel(option.personalContributionPercent)} · ${personal ? "incluidos en la hora" : "se descuentan de la hora"}`,
        badge: personal ? "Incluido" : "Descontado",
        tone: personal ? "included" : "off",
        amount: option.calculatedPersonalContribution,
      },
      { key: "company", label: "Aportes patronales", hint: percentLabel(option.companyContributionPercent), ...added(option.companyContributionPercent), amount: option.calculatedCompanyContribution },
      { key: "incidence", label: "Aguinaldo y salario vacacional", hint: percentLabel(option.incidenceContributionPercent), ...added(option.incidenceContributionPercent), amount: option.calculatedIncidenceContribution },
      {
        key: "bse",
        label: "BSE",
        hint: bse >= 1 ? "incluido en las cargas de esta versión" : "esta versión no lo tiene",
        badge: bse >= 1 ? "Se suma" : "Sin calcular",
        tone: bse >= 1 ? "added" : "off",
        amount: bse,
      },
    ],
  };
};

type CopyOption = Pick<OfficialBudgetRowOptionDto, "hasProducts" | "productsCost" | "netPrice" | "finalPrice">;

// Para pegar en un mensaje: cada opción sin IVA y con el IVA incluido.
export const officialPricesText = (name: string, version: number, options: CopyOption[]) => {
  const { base, products } = pickOfficialOptions(options);
  const lines = [`${name} · versión ${version}`];
  if (base) lines.push(`Sin productos: ${formatBudgetMoney(base.netPrice)} + IVA (${formatBudgetMoney(base.finalPrice)} IVA incluido)`);
  if (products) lines.push(`Con productos: ${formatBudgetMoney(products.netPrice)} + IVA (${formatBudgetMoney(products.finalPrice)} IVA incluido)`);
  return lines.join("\n");
};

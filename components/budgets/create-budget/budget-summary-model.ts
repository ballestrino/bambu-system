import {
  calculateBudgetTotals,
  type BudgetCalculationValues,
} from "@/lib/budget-calculations";

export const formatBudgetMoney = (amount: number) =>
  `$ ${Math.round(amount).toLocaleString("es-UY")}`;

export const formatBudgetDecimal = (amount: number) =>
  amount.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatBudgetNumber = (amount: number, digits = 2) =>
  amount.toLocaleString("es-UY", { maximumFractionDigits: digits });

export type BudgetSummaryTone = "normal" | "total" | "gain" | "final";

export type BudgetSummaryRow = {
  hint?: string;
  key: string;
  label: string;
  tone: BudgetSummaryTone;
  value: string;
};

export type BudgetSummarySegment = {
  amount: number;
  colorClass: string;
  key: string;
  label: string;
  pct: string;
};

// Extras tal como se van escribiendo: con monto, aunque todavía no tengan nombre.
const listExtras = (value: unknown) =>
  (Array.isArray(value) ? value : []).flatMap((item, index) => {
    const extra = (item ?? {}) as { amount?: unknown; name?: unknown };
    const amount = Number(extra.amount);
    if (!Number.isFinite(amount) || amount <= 0) return [];
    const name = typeof extra.name === "string" && extra.name.trim() ? extra.name.trim() : "Extra sin nombre";
    return [{ amount, key: `extra-${index}`, name }];
  });

// El resumen del creador sale del mismo cálculo que guarda la acción.
export const buildBudgetSummary = (values: BudgetCalculationValues, withProducts: boolean) => {
  const totals = calculateBudgetTotals(values);
  const revenuePct = Number(values.revenue_percent) || 0;
  const ivaPct = Number(values.iva) || 22;
  const price = withProducts ? totals.totalPreTaxWithProducts : totals.priceNoTaxService;
  const iva = withProducts ? totals.totalIvaWithProducts : totals.ivaAmountService;
  const productsTotal = withProducts ? totals.priceNoTaxProducts : 0;
  const hourlyRate = totals.totalHours > 0 ? totals.laborCost / totals.totalHours : 0;
  const row = (key: string, label: string, amount: string, tone: BudgetSummaryTone = "normal", hint?: string): BudgetSummaryRow => ({
    hint,
    key,
    label,
    tone,
    value: amount,
  });

  const rows: BudgetSummaryRow[] = [
    row("labor", "Mano de obra", formatBudgetMoney(totals.laborCost), "normal", `${formatBudgetNumber(totals.totalHours)} hs × ${formatBudgetMoney(hourlyRate)}`),
    row("contributions", "Aportes y cargas", formatBudgetMoney(totals.totalContribsExtra)),
    row("transport", "Transporte", formatBudgetMoney(totals.transport)),
    ...listExtras(values.extras).map((extra) => row(extra.key, extra.name, formatBudgetMoney(extra.amount), "normal", "extra")),
  ];
  if (withProducts) rows.push(row("products", "Productos", formatBudgetMoney(totals.products)));
  rows.push(row("cost", "Costo base", formatBudgetMoney(totals.costBasisNoProducts + (withProducts ? totals.products : 0)), "total"));
  rows.push(row("gain", withProducts ? "Ganancia del servicio" : "Ganancia", `+ ${formatBudgetMoney(totals.revenueAmountService)}`, "gain", `${formatBudgetNumber(revenuePct)}%`));
  if (withProducts && totals.revenueAmountProducts > 0) {
    rows.push(row("product-gain", "Ganancia de productos", `+ ${formatBudgetMoney(totals.revenueAmountProducts)}`, "gain", `${formatBudgetNumber(totals.productRevenuePct)}%`));
  }
  rows.push(row("price", "Precio sin IVA", formatBudgetMoney(price), "total"));
  rows.push(row("iva", "IVA", formatBudgetMoney(iva), "normal", `${formatBudgetNumber(ivaPct)}%`));
  rows.push(row("final", "Precio con IVA", formatBudgetMoney(price + iva), "final"));

  const parts = [
    { amount: totals.laborCost, colorClass: "bg-ops-bamboo-strong", key: "labor", label: "Mano de obra" },
    { amount: totals.totalContribsExtra, colorClass: "bg-ops-bamboo", key: "contributions", label: "Aportes" },
    { amount: totals.transport + totals.extrasCost, colorClass: "bg-ops-amber", key: "transport", label: "Transporte y extras" },
    { amount: productsTotal, colorClass: "bg-[#7d93b8]", key: "products", label: "Productos" },
    { amount: totals.revenueAmountService, colorClass: "bg-[#c9e2cd] dark:bg-[#3c5038]", key: "gain", label: "Ganancia" },
  ].filter((part) => part.amount > 0);
  const segments: BudgetSummarySegment[] = parts.map((part) => ({
    ...part,
    pct: price > 0 ? `${Math.round((part.amount / price) * 100)}%` : "0%",
  }));

  return {
    gain: totals.revenueAmountService + (withProducts ? totals.revenueAmountProducts : 0),
    hasProducts: totals.products > 0,
    hourly: withProducts ? totals.hourlyPriceNoTaxWithProducts : totals.hourlyPriceNoTaxService,
    ivaPct,
    price,
    priceWithIva: price + iva,
    productsPrice: totals.totalPreTaxWithProducts,
    revenuePct,
    rows,
    segments,
    totalHours: totals.totalHours,
  };
};

export type BudgetSummary = ReturnType<typeof buildBudgetSummary>;

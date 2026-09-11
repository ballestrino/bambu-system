import type { ChartConfig } from "@/components/ui/chart";

// One value per key, not theme: { light, dark }. The --chart-* tokens already
// flip with the .dark class, so a single var covers both themes.
export const financeTrendChartConfig = {
  recordedRevenue: { label: "Cobrado", color: "var(--chart-1)" },
  employeePaymentsTotal: { label: "Empleadas", color: "var(--chart-2)" },
  manualCostsTotal: { label: "Costes", color: "var(--chart-4)" },
  realProfit: { label: "Resultado", color: "var(--chart-3)" },
} satisfies ChartConfig;

export const financeCostChartConfig = {
  amount: { label: "Egresos" },
} satisfies ChartConfig;

export const financeCostSliceColor = (index: number) =>
  `var(--chart-${(index % 5) + 1})`;

const monthLabelFormat = new Intl.DateTimeFormat("es-UY", {
  month: "short",
  timeZone: "UTC",
  year: "2-digit",
});

/** "2026-09" -> "set 26". Parsed as UTC to match how the buckets were built. */
export const formatTrendMonthLabel = (monthKey: string) => {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) return monthKey;

  const [, year, month] = match;
  return monthLabelFormat.format(
    new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  );
};

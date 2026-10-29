// Atajos de un toque para la lista de presupuestos. Cada grupo escribe los
// mismos parámetros, así que elegir un chip reemplaza al otro del grupo.
export type BudgetQuickChip = {
  isActive: (params: URLSearchParams) => boolean;
  key: string;
  label: string;
  toggle: (params: URLSearchParams) => void;
};

export type BudgetQuickChipGroup = { chips: BudgetQuickChip[]; key: string; label: string };

const setOrClear = (params: URLSearchParams, active: boolean, values: Record<string, string>, extraKeys: string[] = []) => {
  [...Object.keys(values), ...extraKeys].forEach((key) => params.delete(key));
  if (!active) Object.entries(values).forEach(([key, value]) => params.set(key, value));
};

const exactChip = (key: string, label: string, values: Record<string, string>, extraKeys: string[] = []): BudgetQuickChip => {
  const isActive = (params: URLSearchParams) =>
    Object.entries(values).every(([name, value]) => params.get(name) === value) &&
    extraKeys.every((name) => !params.has(name));
  return { isActive, key, label, toggle: (params) => setOrClear(params, isActive(params), values, extraKeys) };
};

const isoDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const weekly = (visits: number) =>
  exactChip(`week-${visits}`, `${visits} por semana`, {
    maxVisits: String(visits),
    minVisits: String(visits),
    visitTypes: "week",
  });

const hours = (amount: number) =>
  exactChip(`hours-${amount}`, `${amount} hs por visita`, {
    maxHoursPerVisit: String(amount),
    minHoursPerVisit: String(amount),
  });

const recent = (days: number, label: string) => exactChip(`recent-${days}`, label, { startDate: isoDaysAgo(days) }, ["endDate"]);

export const BUDGET_QUICK_CHIP_GROUPS: BudgetQuickChipGroup[] = [
  {
    key: "products",
    label: "Productos",
    chips: [
      exactChip("with-products", "Con productos", { hasProducts: "true" }),
      exactChip("without-products", "Sin productos", { hasProducts: "false" }),
    ],
  },
  {
    key: "frequency",
    label: "Frecuencia",
    chips: [
      weekly(1),
      weekly(2),
      weekly(3),
      weekly(5),
      exactChip("daily", "Por día", { visitTypes: "days" }, ["minVisits", "maxVisits"]),
      exactChip("monthly", "Mensual", { visitTypes: "month" }, ["minVisits", "maxVisits"]),
    ],
  },
  { key: "hours", label: "Horas", chips: [hours(2), hours(3), hours(4), hours(6)] },
  {
    key: "updated",
    label: "Actualizado",
    chips: [recent(7, "Últimos 7 días"), recent(30, "Últimos 30 días")],
  },
];

export const toggleCategoryParam = (params: URLSearchParams, categoryId: string) => {
  const current = params.get("categories")?.split(",").filter(Boolean) ?? [];
  const next = current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId];
  if (next.length) params.set("categories", next.join(","));
  else params.delete("categories");
};

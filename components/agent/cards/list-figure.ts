import { formatMoney } from "@/components/agent/format";
import type { ListCardData } from "@/components/agent/types";

type Row = Record<string, unknown>;

// El dato clave de la lista plegada: el rango de importes (los presupuestos
// iguales, sin IVA) o, en correos, cuántos sin leer.
export const listFigure = (data: ListCardData, amount: ((row: Row) => unknown) | undefined) => {
  if (data.kind === "emails") {
    const unread = data.rows.filter((row) => row.unread).length;
    return unread ? `${unread} sin leer` : null;
  }
  const amounts = amount ? data.rows.map(amount).filter((value): value is number => typeof value === "number") : [];
  if (!amounts.length) return null;
  const [low, high] = [Math.min(...amounts), Math.max(...amounts)];
  const range = low === high ? formatMoney(low) : `${formatMoney(low)} a ${formatMoney(high)}`;
  return data.kind === "matchingBudgets" ? `${range} + IVA` : range;
};

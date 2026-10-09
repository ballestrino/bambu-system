import type { VisitDayTotals } from "@/lib/ops/visit-day";

// Color del punto de un dia: atencion gana, despues lo pendiente y por ultimo
// lo ya realizado. Sin visitas no hay punto.
export const getDayDotClass = (totals?: VisitDayTotals) => {
  if (!totals?.total) return "bg-transparent";
  if (totals.attention) return "bg-ops-amber";
  if (totals.scheduled) return "bg-ops-bamboo";
  return "bg-emerald-500";
};

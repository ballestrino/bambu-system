"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { plural } from "@/lib/ops/visit-day";
import { useMobileSchedule } from "@/components/ops/visits/hooks/use-mobile-schedule";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitWeekPills } from "@/components/ops/visits/visit-day-strip";
import { VisitEmployeePickerSheet } from "@/components/ops/visits/visit-employee-picker-sheet";
import { VisitFilterFields } from "@/components/ops/visits/visit-filter-fields";
import { VisitMiniMonth } from "@/components/ops/visits/visit-mini-month";
import { VisitMobileAgenda } from "@/components/ops/visits/visit-mobile-agenda";
import { VisitMobileSchedule } from "@/components/ops/visits/visit-mobile-schedule";
import { VisitMobileVisitSheet } from "@/components/ops/visits/visit-mobile-visit-sheet";
import { VisitSheet } from "@/components/ops/visits/visit-sheet";
import { VisitsMobileHeader } from "@/components/ops/visits/visits-mobile-header";

type MobileSheet = "filtros" | "mes" | "empleadas" | null;

const outline = "h-[52px] flex-1 rounded-[14px] border border-ops-border text-base font-semibold text-ops-text";
const primary = "h-[52px] flex-[1.7] rounded-[14px] bg-ops-bamboo-strong text-base font-semibold text-white dark:text-ops-canvas";

// Visitas en el celular o en un panel angosto (2a).
export const VisitsMobile = ({ ctrl, enabled }: { ctrl: VisitsController; enabled: boolean }) => {
  const [sheet, setSheet] = useState<MobileSheet>(null);
  const schedule = useMobileSchedule(ctrl);
  const { data, desk } = ctrl;
  const isSchedule = desk.view === "cron";
  const closeSheet = (open: boolean) => {
    if (!open) setSheet(null);
  };

  return (
    <div className="flex flex-col gap-2 pb-4">
      <VisitsMobileHeader ctrl={ctrl} onOpenFilters={() => setSheet("filtros")} onOpenMonth={() => setSheet("mes")} />
      <VisitWeekPills dayKey={desk.dayKey} month={desk.month} onPick={desk.goToDay} todayKey={desk.todayKey} totals={data.totals} />
      {isSchedule ? (
        <VisitMobileSchedule ctrl={ctrl} onOpenPicker={() => setSheet("empleadas")} schedule={schedule} />
      ) : (
        <>
          <VisitMobileAgenda ctrl={ctrl} />
          <button
            aria-label="Nueva visita"
            className="fixed right-5 bottom-[calc(var(--bottom-tabs-space)+1.25rem)] z-20 flex size-[58px] items-center justify-center rounded-[20px] bg-ops-bamboo-strong text-white shadow-[0_10px_24px_rgb(36_76_45/0.35)] dark:text-ops-canvas"
            onClick={() => ctrl.newVisit()}
            type="button"
          >
            <Plus className="size-[26px]" />
          </button>
        </>
      )}

      <VisitMobileVisitSheet ctrl={ctrl} enabled={enabled} />
      <VisitEmployeePickerSheet onOpenChange={closeSheet} open={enabled && sheet === "empleadas"} schedule={schedule} />
      <VisitSheet
        footer={
          <div className="flex gap-2">
            <button className={outline} onClick={desk.clearFilters} type="button">Limpiar</button>
            <button className={primary} onClick={() => setSheet(null)} type="button">
              Ver {plural(ctrl.content.visits.length, "visita")}
            </button>
          </div>
        }
        onOpenChange={closeSheet}
        open={enabled && sheet === "filtros"}
        title="Filtrar visitas"
      >
        <div className="px-5 pb-4">
          <VisitFilterFields employeeOptions={data.employeeOptions} filters={desk.filters} jobOptions={data.jobOptions} onChange={desk.updateFilters} size="lg" />
        </div>
      </VisitSheet>
      <VisitSheet
        footer={
          <button
            className={`${outline} w-full`}
            onClick={() => {
              desk.goToToday();
              setSheet(null);
            }}
            type="button"
          >
            Ir a hoy
          </button>
        }
        hideHeader
        onOpenChange={closeSheet}
        open={enabled && sheet === "mes"}
        title="Elegir día"
      >
        <div className="px-3.5 pb-3">
          <VisitMiniMonth
            dayKey={desk.dayKey}
            month={desk.month}
            onPick={(dayKey) => {
              desk.goToDay(dayKey);
              setSheet(null);
            }}
            onShiftMonth={desk.goToDay}
            size="lg"
            todayKey={desk.todayKey}
            totals={data.totals}
          />
        </div>
      </VisitSheet>
    </div>
  );
};

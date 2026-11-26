"use client";

import { CalendarPlus } from "lucide-react";

import { jobsOutlineButtonClass } from "@/components/ops/jobs/jobs-styles";
import { GenerateOccurrencesDialog } from "@/components/ops/occurrences/generate-occurrences-dialog";
import { RulesInspector } from "@/components/ops/schedule-rules/rules-inspector";
import { RulesMatrix } from "@/components/ops/schedule-rules/rules-matrix";
import { RulesPhone } from "@/components/ops/schedule-rules/rules-phone";
import { RulesToolbar } from "@/components/ops/schedule-rules/rules-toolbar";
import { useScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { OpsBackButton } from "@/components/ops/shared";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useElementWidth } from "@/components/ops/visits/hooks/use-element-width";
import { monthPreset, untilMonthEndPreset, weekPreset } from "@/lib/ops/occurrence-generation-presets";
import { shiftDayKey } from "@/lib/ops/schedule-rule-cleanup-window";

// Ancho del panel desde el que va la matriz (como en Visitas, se mide el
// panel y no la ventana).
const DESKTOP_MIN_WIDTH = 896;
const SIDE_PANEL_MIN_WIDTH = 1320;

// Reglas de calendario de todos los servicios (feature 73, diseño de Claude
// Design "Reglas de calendario Bambu").
export const ScheduleRulesPage = () => {
  const ctrl = useScheduleRulesController();
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const wide = width === null ? null : width >= DESKTOP_MIN_WIDTH;
  // La matriz necesita unos 920 px: si no entra con el panel al costado, el
  // panel se abre como hoja lateral al elegir un servicio.
  const side = width !== null && width >= SIDE_PANEL_MIN_WIDTH;
  const nextMonth = shiftDayKey(`${ctrl.todayKey.slice(0, 8)}01`, 32);

  return (
    <div className="@container/rules container flex w-full flex-col pb-8" ref={ref}>
      <OpsBackButton fallbackHref="/dashboard/jobs" />
      {wide !== false ? (
        <div className="hidden flex-col gap-5 @4xl/rules:flex">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ops-bamboo-strong">Operaciones › Trabajos</span>
              <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">Reglas de calendario</h1>
              <p className="max-w-2xl text-[14px] text-ops-text-muted">
                La semana tipo de cada servicio. Un día vacío se toca para darle horario; un horario se toca para
                cambiarlo o limpiar sus visitas.
              </p>
            </div>
            <GenerateOccurrencesDialog
              presets={[
                untilMonthEndPreset(ctrl.todayKey, "De hoy a fin de mes"),
                monthPreset(nextMonth, "El mes que viene"),
                weekPreset(ctrl.todayKey, "Esta semana"),
              ]}
              scopeLabel="todos los trabajos"
              trigger={
                <button className={`${jobsOutlineButtonClass} inline-flex items-center border`} type="button">
                  <CalendarPlus className="size-4" />
                  Generar visitas
                </button>
              }
            />
          </header>
          <RulesToolbar ctrl={ctrl} />
          {side ? (
            <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-5">
              <RulesMatrix ctrl={ctrl} />
              <RulesInspector ctrl={ctrl} />
            </div>
          ) : (
            <>
              <RulesMatrix ctrl={ctrl} />
              {/* No modal: la matriz y el "Deshacer" del aviso siguen tocables con
                  la hoja abierta; se cierra con la X o con Escape. */}
              <Sheet
                modal={false}
                onOpenChange={(open) => (open ? undefined : ctrl.clearSelection())}
                open={wide === true && Boolean(ctrl.selected)}
              >
                <SheetContent
                  className="w-[420px] gap-0 overflow-y-auto bg-ops-surface p-0 shadow-2xl sm:max-w-[420px]"
                  onInteractOutside={(event) => event.preventDefault()}
                  side="right"
                >
                  <SheetTitle className="sr-only">{ctrl.selected?.job.name ?? "Detalle"}</SheetTitle>
                  <SheetDescription className="sr-only">Horarios y visitas del servicio</SheetDescription>
                  <RulesInspector bare ctrl={ctrl} />
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      ) : null}
      {wide !== true ? (
        <div className="@4xl/rules:hidden">
          <RulesPhone ctrl={ctrl} enabled={wide === false} />
        </div>
      ) : null}
    </div>
  );
};

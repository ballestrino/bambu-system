"use client";

import { CalendarDays, LayoutGrid, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { opsSurface } from "@/components/ops/shared";

export type VisitView = "calendar" | "list" | "cards";

const views = [
  { icon: CalendarDays, label: "Calendario", value: "calendar" },
  { icon: List, label: "Lista", value: "list" },
  { icon: LayoutGrid, label: "Cards", value: "cards" },
] as const;

export const isVisitView = (value: unknown): value is VisitView =>
  views.some((view) => view.value === value);

export const VisitViewSwitcher = ({
  onChange,
  value,
}: {
  onChange: (view: VisitView) => void;
  value: VisitView;
}) => (
  <section
    aria-label="Visualización de visitas"
    className={`${opsSurface.toolbar} flex flex-wrap items-center justify-between gap-3`}
  >
    <div>
      <h2 className="text-sm font-semibold text-[#18251D] dark:text-[#F0F3E8]">
        Visualización
      </h2>
      <p className="text-xs text-muted-foreground">
        Cambia el nivel de detalle sin perder los filtros.
      </p>
    </div>
    <div className="flex rounded-md border border-[#53985E]/20 bg-background p-1">
      {views.map(({ icon: Icon, label, value: nextView }) => (
        <Button
          aria-pressed={value === nextView}
          className="rounded-sm"
          key={nextView}
          onClick={() => onChange(nextView)}
          size="sm"
          type="button"
          variant={value === nextView ? "default" : "ghost"}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  </section>
);

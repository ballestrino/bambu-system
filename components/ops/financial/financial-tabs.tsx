"use client";

import type { KeyboardEvent } from "react";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

import {
  financeSections,
  type FinanceSection,
} from "@/components/ops/financial/financial-sections";
import { opsFilterControlClass, opsSurface } from "@/components/ops/shared";
import { cn } from "@/lib/utils";

export const financeTabId = (section: FinanceSection) => `finanzas-tab-${section}`;
export const financePanelId = (section: FinanceSection) =>
  `finanzas-panel-${section}`;

export const FinancialTabs = ({
  onSectionChange,
  section,
}: {
  onSectionChange: (section: FinanceSection) => void;
  section: FinanceSection;
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = financeSections.findIndex((item) => item.id === section);

  // Manual activation: arrows move focus only. Activating on every arrow would
  // push one history entry per keypress.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const lastIndex = financeSections.length - 1;
    const focusedIndex = tabRefs.current.findIndex(
      (element) => element === document.activeElement
    );
    const fromIndex = focusedIndex >= 0 ? focusedIndex : selectedIndex;
    const nextIndex =
      event.key === "ArrowRight"
        ? fromIndex === lastIndex
          ? 0
          : fromIndex + 1
        : event.key === "ArrowLeft"
          ? fromIndex === 0
            ? lastIndex
            : fromIndex - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : -1;

    if (nextIndex < 0) return;
    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <>
      <div
        aria-label="Secciones de Finanzas"
        className={cn(opsSurface.toolbar, "hidden gap-1 overflow-x-auto md:flex")}
        onKeyDown={handleKeyDown}
        role="tablist"
      >
        {financeSections.map(({ icon: Icon, id, label }, index) => {
          const isSelected = id === section;
          return (
            <button
              aria-controls={financePanelId(id)}
              aria-selected={isSelected}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--ops-radius-control)] px-3 text-sm font-medium transition-colors",
                isSelected
                  ? "bg-ops-surface text-ops-bamboo-strong"
                  : "text-ops-text-muted hover:bg-ops-surface hover:text-ops-text"
              )}
              id={financeTabId(id)}
              key={id}
              onClick={() => onSectionChange(id)}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <label className="relative block md:hidden">
        <span className="sr-only">Sección de Finanzas</span>
        <select
          className={cn(opsFilterControlClass, "appearance-none border pr-10 text-sm")}
          onChange={(event) =>
            onSectionChange(event.target.value as FinanceSection)
          }
          value={section}
        >
          {financeSections.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ops-text-muted" />
      </label>
    </>
  );
};

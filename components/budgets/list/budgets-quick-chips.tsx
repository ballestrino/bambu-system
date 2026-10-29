"use client";

import { Check, X } from "lucide-react";

import useBudgetCategories from "@/components/budgets/categories/hooks/useBudgetCategories";
import { BUDGET_QUICK_CHIP_GROUPS, toggleCategoryParam } from "@/components/budgets/list/budget-quick-chips";
import { cn } from "@/lib/utils";

type BudgetsQuickChipsProps = {
  hasFilters: boolean;
  onClear: () => void;
  params: URLSearchParams;
  updateParams: (change: (next: URLSearchParams) => void) => void;
};

const chipClass = (active: boolean) =>
  cn(
    "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition-colors md:h-9",
    active
      ? "border-ops-bamboo bg-ops-bamboo-soft font-semibold text-ops-bamboo-strong"
      : "border-ops-border bg-ops-surface font-medium text-ops-text-muted hover:text-ops-text"
  );

const QuickChip = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button aria-pressed={active} className={chipClass(active)} onClick={onClick} type="button">
    {active ? <Check className="size-3.5" /> : null}
    {label}
  </button>
);

// Atajos de un toque agrupados. En el celular van todos en una sola fila que
// se desliza de costado, para no empujar la lista hacia abajo.
export const BudgetsQuickChips = ({ hasFilters, onClear, params, updateParams }: BudgetsQuickChipsProps) => {
  const { categories } = useBudgetCategories();
  const selectedCategories = params.get("categories")?.split(",") ?? [];
  const groups = [
    ...BUDGET_QUICK_CHIP_GROUPS.map((group) => ({
      key: group.key,
      label: group.label,
      chips: group.chips.map((chip) => ({
        active: chip.isActive(params),
        key: chip.key,
        label: chip.label,
        onClick: () => updateParams(chip.toggle),
      })),
    })),
    ...(categories.length
      ? [{
          key: "categories",
          label: "Categoría",
          chips: categories.map((category) => ({
            active: selectedCategories.includes(category.id),
            key: category.id,
            label: category.name,
            onClick: () => updateParams((next) => toggleCategoryParam(next, category.id)),
          })),
        }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-3.5 flex gap-4 overflow-x-auto px-3.5 [scrollbar-width:none] md:mx-0 md:flex-col md:gap-2 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {groups.map((group) => (
          <div className="flex shrink-0 items-center gap-2 md:shrink" key={group.key}>
            <span className="shrink-0 text-xs font-semibold text-ops-text-muted md:w-[84px]">{group.label}</span>
            <div className="flex gap-1.5 md:min-w-0 md:flex-1 md:flex-wrap">
              {group.chips.map((chip) => (
                <QuickChip active={chip.active} key={chip.key} label={chip.label} onClick={chip.onClick} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {hasFilters ? (
        <button
          className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text"
          onClick={onClear}
          type="button"
        >
          <X className="size-3.5" />
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
};

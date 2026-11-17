import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, ReceiptText } from "lucide-react";

type BudgetDetailHeaderProps = {
  backHref: string;
  backLabel: string;
  title: string;
  badge: ReactNode;
  subtitle: string;
  categories: { key: string; name: string }[];
  actions: ReactNode;
  children: ReactNode;
};

const badgeBase = "inline-flex h-[26px] items-center gap-[5px] rounded-full border px-2.5 text-xs font-semibold";

// Estado del generador: oficial con su versión (lleva al oficial) o borrador.
export const GeneratorStatusBadge = ({ official }: { official: { id: string; currentVersion: number } | null }) =>
  official ? (
    <Link
      className={`${badgeBase} border-ops-bamboo/35 bg-ops-bamboo-soft text-ops-bamboo-strong hover:bg-ops-bamboo-soft/70`}
      href={`/dashboard/official-budgets/${official.id}`}
    >
      <BadgeCheck className="size-[13px]" />
      Oficial v{official.currentVersion}
    </Link>
  ) : (
    <span className={`${badgeBase} border-ops-border text-ops-text-muted`}>Borrador</span>
  );

// Estado de un oficial: activo o archivado, con la versión que se está viendo.
export const OfficialStatusBadge = ({ active, version }: { active: boolean; version?: number }) => (
  <span
    className={
      active
        ? `${badgeBase} border-ops-bamboo/35 bg-ops-bamboo-soft text-ops-bamboo-strong`
        : `${badgeBase} border-ops-border bg-ops-surface-muted text-ops-text-muted`
    }
  >
    {active ? <BadgeCheck className="size-[13px]" /> : null}
    {active ? "Activo" : "Archivado"}
    {version === undefined ? null : ` · v${version}`}
  </span>
);

// Cabecera del detalle (generador u oficial): volver, nombre con su estado,
// descripción, categorías y acciones; abajo van los números (children).
export const BudgetDetailHeader = ({ backHref, backLabel, title, badge, subtitle, categories, actions, children }: BudgetDetailHeaderProps) => (
  <section className="flex flex-col gap-5 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-5">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
        <Link
          className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-[10px] px-2.5 text-[13.5px] font-semibold text-ops-bamboo-strong hover:text-ops-bamboo"
          href={backHref}
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 flex-none place-items-center rounded-[10px] bg-ops-bamboo-soft text-ops-bamboo-strong">
            <ReceiptText className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">{title}</h1>
              {badge}
            </div>
            <p className="text-[14.5px] text-ops-text-muted">{subtitle}</p>
            {categories.length ? (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <span
                    className="inline-flex h-[26px] items-center rounded-full bg-ops-surface-muted px-2.5 text-[12.5px] font-medium text-ops-text"
                    key={category.key}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {actions}
    </div>
    {children}
  </section>
);

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type OpsDetailHeroProps = {
  actions?: ReactNode;
  backHref: string;
  backLabel: string;
  children?: ReactNode;
  description?: string;
  icon: LucideIcon;
  meta?: ReactNode;
  title: string;
};

type OpsDetailStatProps = {
  helper?: string;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
};

type OpsNextActionProps = {
  action?: ReactNode;
  description: string;
  icon: LucideIcon;
  label?: string;
  title: string;
  tone?: "active" | "money" | "warning";
};

const nextActionTone = {
  active:
    "border-[#53985E]/20 bg-[#F3FAF4] text-[#244C2D] dark:border-[#53985E]/35 dark:bg-[#53985E]/10 dark:text-[#A7D8AE]",
  money:
    "border-[#C58A2A]/25 bg-[#FFF7E6] text-[#6F4B12] dark:border-[#C58A2A]/40 dark:bg-[#C58A2A]/15 dark:text-[#F5D28C]",
  warning:
    "border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
} as const;

export const OpsDetailHero = ({
  actions,
  backHref,
  backLabel,
  children,
  description,
  icon: Icon,
  meta,
  title,
}: OpsDetailHeroProps) => (
  <section className="relative overflow-hidden rounded-2xl border border-[#53985E]/15 bg-white p-4 shadow-sm shadow-[#244C2D]/5 dark:bg-[#101811] md:p-5">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#244C2D] via-[#53985E] to-[#C58A2A]" />
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-4">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="-ml-2 w-fit rounded-full px-3 text-[#244C2D] hover:bg-[#EAF5EC] hover:text-[#244C2D]"
        >
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EAF5EC] text-[#244C2D] ring-1 ring-[#53985E]/20">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-semibold tracking-tight text-[#18251D] dark:text-[#EAF5EC] md:text-3xl">
                {title}
              </h1>
              {meta}
            </div>
            {description ? (
              <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
    {children ? (
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    ) : null}
  </section>
);

export const OpsDetailStat = ({
  helper,
  icon: Icon,
  label,
  value,
}: OpsDetailStatProps) => (
  <div className="rounded-xl border border-[#53985E]/15 bg-[#F8FBF8] p-3 dark:bg-[#132016]">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="h-4 w-4 text-[#53985E]" />
      {label}
    </div>
    <p className="mt-2 text-xl font-semibold text-[#18251D] dark:text-[#EAF5EC]">
      {value}
    </p>
    {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
  </div>
);

export const OpsNextAction = ({
  action,
  description,
  icon: Icon,
  label = "Siguiente accion",
  title,
  tone = "active",
}: OpsNextActionProps) => (
  <section
    className={cn(
      "flex flex-col gap-4 rounded-2xl border p-4 shadow-sm shadow-[#244C2D]/5 md:flex-row md:items-center md:justify-between",
      nextActionTone[tone]
    )}
  >
    <div className="flex min-w-0 gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70 ring-1 ring-current/10 dark:bg-background/30">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </section>
);

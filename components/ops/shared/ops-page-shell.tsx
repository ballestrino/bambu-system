import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { opsSurface } from "@/components/ops/shared/ops-theme";

type OpsPageShellProps = {
  children: ReactNode;
  className?: string;
};

type OpsPageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

type OpsSectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

type OpsToolbarProps = {
  children: ReactNode;
  summary?: ReactNode;
  className?: string;
};

export const OpsPageShell = ({ children, className }: OpsPageShellProps) => (
  <div className={cn("container flex w-full flex-col gap-5 pb-8", className)}>
    {children}
  </div>
);

export const OpsPageHeader = ({
  actions,
  className,
  description,
  eyebrow,
  meta,
  title,
}: OpsPageHeaderProps) => (
  <div
    className={cn(
      "relative flex flex-col gap-4 pl-4 md:flex-row md:items-end md:justify-between",
      opsSurface.headerAccent,
      className
    )}
  >
    <div className="min-w-0 space-y-1">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-[#53985E]">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[#18251D] dark:text-[#EAF5EC] md:text-3xl">
          {title}
        </h1>
        {meta}
      </div>
      {description ? (
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </div>
);

export const OpsToolbar = ({ children, className, summary }: OpsToolbarProps) => (
  <div className={cn(opsSurface.toolbar, className)}>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid flex-1 items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto] lg:flex lg:flex-wrap">
        {children}
      </div>
      {summary ? (
        <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {summary}
        </div>
      ) : null}
    </div>
  </div>
);

export const OpsSection = ({
  actions,
  children,
  className,
  description,
  title,
}: OpsSectionProps) => (
  <section className={cn(opsSurface.panel, "p-4 md:p-5", className)}>
    {title || description || actions ? (
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    ) : null}
    {children}
  </section>
);

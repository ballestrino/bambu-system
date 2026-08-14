import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { opsSurface } from "@/components/ops/shared/ops-theme";

type OpsRecordListProps = {
  children: ReactNode;
  className?: string;
};

type OpsRecordItemProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  status?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export const OpsRecordList = ({ children, className }: OpsRecordListProps) => (
  <div className={cn("grid gap-3", className)}>{children}</div>
);

export const OpsRecordItem = ({
  actions,
  className,
  description,
  footer,
  leading,
  meta,
  status,
  subtitle,
  title,
}: OpsRecordItemProps) => (
  <article
    className={cn(
      opsSurface.panel,
      "grid gap-4 p-4 transition-colors hover:border-[#53985E]/35 md:grid-cols-[auto_minmax(0,1fr)_auto]",
      className
    )}
  >
    {leading ? <div className="flex items-start">{leading}</div> : null}
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[#18251D] dark:text-[#F0F3E8]">
            {title}
          </h3>
          {subtitle ? (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {status}
      </div>
      {description ? (
        <div className="line-clamp-2 text-sm text-muted-foreground">
          {description}
        </div>
      ) : null}
      {meta ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {meta}
        </div>
      ) : null}
      {footer ? <div className="pt-1">{footer}</div> : null}
    </div>
    {actions ? (
      <div className="flex flex-wrap items-start gap-2 md:justify-end">{actions}</div>
    ) : null}
  </article>
);

export const OpsRecordSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className={cn(opsSurface.panel, "h-28 animate-pulse bg-muted/40")}
      />
    ))}
  </div>
);

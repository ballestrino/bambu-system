import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DashboardSectionError = ({
  className,
  description,
  onRetry,
  title,
}: {
  className?: string;
  description: string;
  onRetry: () => Promise<unknown> | void;
  title: string;
}) => (
  <div
    className={cn(
      "flex flex-col gap-3 rounded-[var(--ops-radius-row)] border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
      className
    )}
    role="alert"
  >
    <div className="flex min-w-0 gap-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="opacity-80">{description}</p>
      </div>
    </div>
    <Button
      className="min-h-11 shrink-0 border-current bg-transparent shadow-none"
      onClick={() => void onRetry()}
      variant="outline"
    >
      <RefreshCw />
      Reintentar
    </Button>
  </div>
);

"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const OpsRefreshButton = ({
  className,
  isRefreshing,
  onRefresh,
}: {
  className?: string;
  isRefreshing?: boolean;
  onRefresh: () => Promise<unknown> | void;
}) => (
  <Button
    type="button"
    variant="outline"
    className={cn(
      "min-h-11 rounded-[var(--ops-radius-control)] border-ops-border px-4 text-ops-text shadow-none",
      className
    )}
    disabled={isRefreshing}
    onClick={() => void onRefresh()}
  >
    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
    Refrescar
  </Button>
);

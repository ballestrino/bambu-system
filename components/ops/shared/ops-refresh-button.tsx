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
      "h-12 rounded-full border-[#53985E]/25 px-4 text-[#244C2D] dark:text-[#A7D8AE]",
      className
    )}
    disabled={isRefreshing}
    onClick={() => void onRefresh()}
  >
    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
    Refrescar
  </Button>
);

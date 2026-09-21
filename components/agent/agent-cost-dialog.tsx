"use client";

import { ChevronLeft, ChevronRight, CircleDollarSign } from "lucide-react";
import { useState } from "react";

import {
  ConversationCostSection,
  CostSkeleton,
  MonthlyCostSection,
} from "@/components/agent/agent-cost-sections";
import { capitalizeFirst } from "@/components/agent/format";
import { useConversationCost, useMonthlyAgentCost } from "@/components/agent/hooks/use-agent-queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMonthLabel, shiftMonthKey } from "@/lib/agent/month";

// "Costos de IA": esta conversación por tipo y modelo, y el mes del equipo
// por modelo y modo. El mes actual lo decide el servidor (hora de
// Montevideo); desde ahí se navega hacia atrás.
export function AgentCostDialog({
  open,
  onOpenChange,
  conversationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
}) {
  const [offset, setOffset] = useState(0);
  const current = useMonthlyAgentCost(null, open);
  const currentMonth = current.data?.month ?? null;
  const month = offset === 0 || !currentMonth ? null : shiftMonthKey(currentMonth, offset);
  const monthly = useMonthlyAgentCost(month, open && (offset === 0 || Boolean(currentMonth)));
  const conversation = useConversationCost(conversationId, open);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setOffset(0);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <CircleDollarSign className="size-5" aria-hidden /> Costos de IA
          </DialogTitle>
          <DialogDescription>
            Estimados en dólares con los precios de cada modelo al momento del uso.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Esta conversación</h3>
          {!conversationId ? (
            <p className="text-xs text-muted-foreground">Esta conversación todavía no tiene consumo.</p>
          ) : conversation.isPending ? (
            <CostSkeleton />
          ) : conversation.isError ? (
            <p className="text-xs text-destructive">{conversation.error.message}</p>
          ) : (
            <ConversationCostSection cost={conversation.data} />
          )}
        </section>

        <section className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">
              {monthly.data ? capitalizeFirst(formatMonthLabel(monthly.data.month)) : "Mes"}
            </h3>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-11 sm:size-8"
                disabled={!currentMonth}
                onClick={() => setOffset((value) => value - 1)}
                aria-label="Mes anterior"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 sm:size-8"
                disabled={offset === 0}
                onClick={() => setOffset((value) => Math.min(0, value + 1))}
                aria-label="Mes siguiente"
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          </div>
          {monthly.isPending ? (
            <CostSkeleton />
          ) : monthly.isError ? (
            <p className="text-xs text-destructive">{monthly.error.message}</p>
          ) : (
            <MonthlyCostSection cost={monthly.data} />
          )}
          <p className="text-xs text-muted-foreground">Incluye el uso de todo el equipo y de conversaciones borradas.</p>
        </section>
      </DialogContent>
    </Dialog>
  );
}

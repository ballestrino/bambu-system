"use client";

import Link from "next/link";
import { Archive, BadgeCheck, Loader2, Send } from "lucide-react";

import { useOfficialBudgetMutations } from "@/components/official-budgets/hooks/use-official-budget-mutations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type LinkedOfficial = {
  id: string;
  status: "ACTIVE" | "ARCHIVED";
  currentVersion: number;
};

export function GeneratorOfficialControl({
  sourceBudgetId,
  officialBudget,
  compact = false,
}: {
  sourceBudgetId: string;
  officialBudget?: LinkedOfficial | null;
  compact?: boolean;
}) {
  const { publish } = useOfficialBudgetMutations();

  if (officialBudget) {
    return (
      <Link href={`/dashboard/official-budgets/${officialBudget.id}`}>
        <Badge className="gap-1 bg-[#EAF5EC] text-[#244C2D] hover:bg-[#DCEEDF]">
          <BadgeCheck className="h-3.5 w-3.5" /> Oficial v{officialBudget.currentVersion}
        </Badge>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      size={compact ? "sm" : "default"}
      variant="outline"
      disabled={publish.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        publish.mutate(sourceBudgetId);
      }}
    >
      {publish.isPending ? <Loader2 className="animate-spin" /> : <Send />}
      Publicar como oficial
    </Button>
  );
}

export function ArchiveOfficialBudgetButton({ id }: { id: string }) {
  const { archive } = useOfficialBudgetMutations();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={archive.isPending}
      onClick={() => {
        if (window.confirm("¿Archivar y desvincular este presupuesto oficial? El historial se conservará.")) {
          archive.mutate(id);
        }
      }}
    >
      {archive.isPending ? <Loader2 className="animate-spin" /> : <Archive />}
      Archivar y desvincular
    </Button>
  );
}

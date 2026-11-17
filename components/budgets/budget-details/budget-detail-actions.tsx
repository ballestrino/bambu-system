"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Loader2, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";

import { AgentSheetHost } from "@/components/agent/agent-sheet-host";
import { useDeleteBudgetMutation } from "@/components/budgets/hooks/useDeleteBudgetMutation";
import { useDuplicateBudgetMutation } from "@/components/budgets/hooks/useDuplicateBudgetMutation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const outlineAction =
  "inline-flex h-11 items-center gap-[7px] rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-50";

type BudgetDetailActionsProps = {
  budget: { id: string; slug: string; name: string; officialBudget: { id: string } | null };
};

// Asistente, Duplicar, Editar y el menú con Eliminar. Un oficial vinculado no se
// elimina: primero se archiva.
export const BudgetDetailActions = ({ budget }: BudgetDetailActionsProps) => {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { duplicateBudget, isDuplicating } = useDuplicateBudgetMutation();
  const { deleteBudgetAsync } = useDeleteBudgetMutation();

  const handleDelete = async () => {
    await deleteBudgetAsync(budget.id);
    router.push("/dashboard/budgets");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <AgentSheetHost
        budgetId={budget.id}
        budgetName={budget.name}
        budgetSlug={budget.slug}
        trigger={
          <button className={outlineAction} type="button">
            <Sparkles className="size-[15px]" />
            Asistente
          </button>
        }
      />
      <button className={outlineAction} disabled={isDuplicating} onClick={() => duplicateBudget(budget.id)} type="button">
        {isDuplicating ? <Loader2 className="size-[15px] animate-spin" /> : <Copy className="size-[15px]" />}
        Duplicar
      </button>
      <Link
        className="inline-flex h-11 items-center gap-[7px] rounded-[10px] bg-ops-bamboo-strong px-[18px] text-[13.5px] font-semibold text-ops-surface hover:bg-ops-bamboo-strong/90"
        href={`/dashboard/budgets/edit/${budget.slug}`}
      >
        <Pencil className="size-[15px]" />
        Editar
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Más acciones"
            className="grid size-11 place-items-center rounded-[10px] border border-ops-border bg-ops-surface text-ops-text hover:bg-ops-surface-muted"
            type="button"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={Boolean(budget.officialBudget)}
            onSelect={() => setConfirmDelete(true)}
            variant="destructive"
          >
            <Trash2 className="size-4" />
            {budget.officialBudget ? "Oficial: archivalo para eliminarlo" : "Eliminar presupuesto"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <BudgetDeleteConfirm name={budget.name} onConfirm={handleDelete} onOpenChange={setConfirmDelete} open={confirmDelete} />
    </div>
  );
};

type BudgetDeleteConfirmProps = {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

const BudgetDeleteConfirm = ({ name, open, onOpenChange, onConfirm }: BudgetDeleteConfirmProps) => {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <Dialog onOpenChange={(next) => !deleting && onOpenChange(next)} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar presupuesto</DialogTitle>
          <DialogDescription>¿Seguro que querés eliminar &quot;{name}&quot;? No se puede deshacer.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={deleting} onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button disabled={deleting} onClick={confirm} type="button" variant="destructive">
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

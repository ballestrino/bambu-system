"use client";

import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useOfficialBudgetMutations } from "@/components/official-budgets/hooks/use-official-budget-mutations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OfficialArchiveDialogProps = {
  id: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Archivar desvincula el oficial de su generador: deja de publicar versiones y
// el generador vuelve a ser un borrador. El historial queda.
export const OfficialArchiveDialog = ({ id, name, open, onOpenChange }: OfficialArchiveDialogProps) => {
  const { archive } = useOfficialBudgetMutations();

  return (
    <Dialog onOpenChange={(next) => !archive.isPending && onOpenChange(next)} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archivar y desvincular</DialogTitle>
          <DialogDescription>
            &quot;{name}&quot; deja de ser un precio oficial vigente y su generador vuelve a ser un borrador. Las versiones
            publicadas se conservan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={archive.isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button
            disabled={archive.isPending}
            onClick={() => archive.mutate(id, { onSuccess: () => onOpenChange(false) })}
            type="button"
            variant="destructive"
          >
            {archive.isPending ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
            Archivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const copyOfficialPrices = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Precios copiados");
  } catch {
    toast.error("No se pudieron copiar los precios");
  }
};

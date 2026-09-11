"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Confirmation for voiding a Finance record. The row mounts it open when its
// "Anular" button is pressed and unmounts it on close, so a page of rows does
// not keep one dialog per record alive. Voiding keeps the record as history,
// so the confirm button is not styled as a destructive delete.
export const FinancialVoidDialog = ({
  description,
  onConfirm,
  onOpenChange,
  title,
}: {
  description: string;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  title: string;
}) => {
  const [isPending, setIsPending] = useState(false);

  const confirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog defaultOpen onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button disabled={isPending} onClick={() => void confirm()} type="button">
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            Anular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

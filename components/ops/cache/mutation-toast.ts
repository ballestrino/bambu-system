"use client";

import { toast } from "sonner";

export type MutationErrorAction = {
  onErrorAction?: () => void;
};

export const stripMutationErrorAction = <T extends MutationErrorAction>(values: T) => {
  const nextValues = { ...values };
  delete nextValues.onErrorAction;

  return nextValues;
};

export const showMutationError = (error: unknown, fallback: string, action?: () => void) => {
  const message = error instanceof Error ? error.message : fallback;

  toast.error(message, action ? {
    action: {
      label: "Reabrir",
      onClick: action,
    },
  } : undefined);
};

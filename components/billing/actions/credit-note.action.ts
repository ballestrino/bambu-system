"use server";

import { issueCreditNote, retryCreditNote } from "@/actions/billing/credit-note";

export type CreditNoteResult = { conflict?: boolean; error?: string; noteId?: string; success?: string; unknown?: boolean };

// Envoltorios de la nota de crédito. Devuelven el { error } en vez de tirarlo:
// en producción Next oculta el mensaje de un error tirado en una server
// action, y acá el mensaje es lo que el usuario necesita leer. El hook lo
// convierte en error del lado del cliente.
export const issueCreditNoteAction = async (values: unknown): Promise<CreditNoteResult> => issueCreditNote(values);

export const retryCreditNoteAction = async (noteId: string): Promise<CreditNoteResult> => retryCreditNote(noteId);

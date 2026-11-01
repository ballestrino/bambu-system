import { buildCreditNotePayload, type CreditNoteInput } from "@/lib/billing/credit-note-payload";
import { getIssueDay } from "@/lib/billing/issue-payload";
import { FatalIssueError, sendWithLookup, type SendDeps, type SendOutcome } from "@/lib/billing/issue-run";

export type CreditNoteRunDeps = SendDeps & {
  now: () => Date;
  store: {
    load: (noteId: string) => Promise<CreditNoteInput | null>;
    save: (noteId: string, outcome: SendOutcome, issueDate: Date, at: Date) => Promise<void>;
  };
};

export type CreditNoteRunResult =
  | { kind: "issued"; number: number; series: string }
  | { kind: "found"; number: number; series: string | null }
  | { kind: "failed"; message: string }
  | { kind: "unknown"; message: string };

// Manda la nota de crédito que quedó en ISSUING al confirmar. Mismas reglas
// que el lote (regla 3): ante una respuesta dudosa se busca por su
// numero_interno antes de reintentar y, si no se sabe, queda UNKNOWN.
export const runCreditNoteIssue = async (noteId: string, deps: CreditNoteRunDeps): Promise<CreditNoteRunResult> => {
  const input = await deps.store.load(noteId);
  if (!input) return { kind: "failed", message: "La nota ya no está para emitir" };
  const issueDate = getIssueDay(deps.now());
  const payload = buildCreditNotePayload(input, issueDate);

  let outcome: SendOutcome;
  try {
    outcome = await sendWithLookup(payload, deps, async () => undefined);
  } catch (error) {
    if (!(error instanceof FatalIssueError)) throw error;
    outcome = { kind: "failed", message: error.message };
  }
  await deps.store.save(noteId, outcome, issueDate, deps.now());

  if (outcome.kind === "issued") return { kind: "issued", number: outcome.cfe.number, series: outcome.cfe.series };
  if (outcome.kind === "found") return { kind: "found", number: outcome.row.numero, series: outcome.row.serie ?? null };
  return outcome;
};

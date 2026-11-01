import { describeBillerError } from "@/lib/billing/biller-errors";
import {
  isDuplicateInternalNumber,
  isFatalIssueError,
  isUncertainIssueError,
  type BillerIssuer,
  type IssuedCfe,
} from "@/lib/billing/biller-issue";
import type { BillerInvoice } from "@/lib/billing/biller-schemas";
import { buildIssuePlan, getIssueDay, type IssueInput } from "@/lib/billing/issue-payload";

export type IssueCandidate = IssueInput & { batchId: string; id: string };

export type IssueOutcome =
  | { cfe: IssuedCfe; dueDate: Date | null; issueDate: Date; kind: "issued"; paymentForm: number }
  | { kind: "found"; row: BillerInvoice }
  | { kind: "failed"; message: string }
  | { kind: "unknown"; message: string };

export type IssueRunStore = {
  // La próxima factura del lote en ISSUING que todavía no se intentó en esta corrida.
  nextIssuing: (batchId: string, skipIds: string[]) => Promise<IssueCandidate | null>;
  saveOutcome: (candidate: IssueCandidate, outcome: IssueOutcome, at: Date) => Promise<void>;
  // Las que quedan en ISSUING vuelven al borrador con el error. Devuelve cuántas.
  failRemaining: (batchId: string, message: string, at: Date) => Promise<number>;
  finishBatch: (batchId: string, at: Date) => Promise<void>;
};

export type IssueRunDeps = {
  findByInternalNumber: (internalNumber: string) => Promise<BillerInvoice | null>;
  issuer: BillerIssuer;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  store: IssueRunStore;
};

export type IssueRunResult = { failed: number; issued: number; unknown: number };

// Biller permite emitir 1 vez por segundo por token.
export const ISSUE_SPACING_MS = 1_100;
const LOOKUP_WAIT_MS = 1_500;

const UNKNOWN_MESSAGE = "Biller no confirmó la emisión y no aparece por su número interno. Se puede reintentar sin duplicar.";

class FatalIssueError extends Error {}

// Una factura: se arma, se manda y, si la respuesta no es clara (timeout, 5xx),
// se busca por numero_interno antes de reintentar una sola vez. Si sigue sin
// saberse, queda UNKNOWN (regla 3). Un reintento nunca duplica: Biller
// rechaza el numero_interno repetido y entonces se toma el que ya existe.
const issueOne = async (
  candidate: IssueCandidate,
  deps: IssueRunDeps,
  waitTurn: () => Promise<void>
): Promise<IssueOutcome> => {
  const plan = buildIssuePlan(candidate, getIssueDay(deps.now()));
  if (!plan.ok) return { kind: "failed", message: plan.error };
  const internalNumber = plan.payload.numero_interno;

  const lookup = async () => {
    try {
      return await deps.findByInternalNumber(internalNumber);
    } catch {
      return "error" as const;
    }
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await waitTurn();
    try {
      const cfe = await deps.issuer.issue(plan.payload);
      return { cfe, dueDate: plan.dueDate, issueDate: plan.issueDate, kind: "issued", paymentForm: plan.paymentForm };
    } catch (error) {
      if (isFatalIssueError(error)) throw new FatalIssueError(describeBillerError(error));
      if (isDuplicateInternalNumber(error)) {
        const row = await lookup();
        return row && row !== "error" ? { kind: "found", row } : { kind: "unknown", message: UNKNOWN_MESSAGE };
      }
      if (!isUncertainIssueError(error)) return { kind: "failed", message: describeBillerError(error) };

      await deps.sleep(LOOKUP_WAIT_MS);
      const row = await lookup();
      if (row && row !== "error") return { kind: "found", row };
      if (row === "error") return { kind: "unknown", message: UNKNOWN_MESSAGE };
    }
  }
  return { kind: "unknown", message: UNKNOWN_MESSAGE };
};

// Emite, de a una y con 1,1 s entre envíos, las facturas del lote que quedaron
// en ISSUING al confirmar. Cada resultado se guarda apenas llega, así la
// página muestra el avance. Al final el lote vuelve a DRAFT si algo quedó sin
// emitir o pasa a DONE.
export const runBatchIssue = async (batchId: string, deps: IssueRunDeps): Promise<IssueRunResult> => {
  const result: IssueRunResult = { failed: 0, issued: 0, unknown: 0 };
  const tried: string[] = [];
  let lastSend = 0;
  const waitTurn = async () => {
    const wait = lastSend + ISSUE_SPACING_MS - deps.now().getTime();
    if (wait > 0) await deps.sleep(wait);
    lastSend = deps.now().getTime();
  };

  try {
    for (;;) {
      const candidate = await deps.store.nextIssuing(batchId, tried);
      if (!candidate) break;
      tried.push(candidate.id);

      let outcome: IssueOutcome;
      try {
        outcome = await issueOne(candidate, deps, waitTurn);
      } catch (error) {
        if (!(error instanceof FatalIssueError)) throw error;
        await deps.store.saveOutcome(candidate, { kind: "failed", message: error.message }, deps.now());
        result.failed += 1 + (await deps.store.failRemaining(batchId, error.message, deps.now()));
        break;
      }
      await deps.store.saveOutcome(candidate, outcome, deps.now());
      if (outcome.kind === "failed") result.failed += 1;
      else if (outcome.kind === "unknown") result.unknown += 1;
      else result.issued += 1;
    }
  } finally {
    await deps.store.finishBatch(batchId, deps.now());
  }
  return result;
};

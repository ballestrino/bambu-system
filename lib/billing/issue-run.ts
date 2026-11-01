import { describeBillerError } from "@/lib/billing/biller-errors";
import {
  isDuplicateInternalNumber,
  isFatalIssueError,
  isUncertainIssueError,
  type BillerIssuer,
  type IssuedCfe,
} from "@/lib/billing/biller-issue";
import type { BillerInvoice } from "@/lib/billing/biller-schemas";
import { PAYMENT_FORM } from "@/lib/billing/draft-repeat";
import { resolveDraftDates } from "@/lib/billing/invoice-dates";
import { buildIssuePlan, getIssueDay, type IssueInput, type IssuePayload } from "@/lib/billing/issue-payload";

// issueDate y dueDate son los que eligió la persona en el editor (49), o null.
export type IssueCandidate = IssueInput & { batchId: string; id: string; issueDate: Date | null; period: Date };

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

export class FatalIssueError extends Error {}

export type SendOutcome =
  | { cfe: IssuedCfe; kind: "issued" }
  | { kind: "found"; row: BillerInvoice }
  | { kind: "failed"; message: string }
  | { kind: "unknown"; message: string };

export type SendDeps = Pick<IssueRunDeps, "findByInternalNumber" | "issuer" | "sleep">;

// Manda un pedido y, si la respuesta no es clara (timeout, 5xx), busca por
// numero_interno antes de reintentar una sola vez. Si sigue sin saberse, queda
// UNKNOWN (regla 3). Un reintento nunca duplica: Biller rechaza el
// numero_interno repetido y entonces se toma el que ya existe. Lo usan el
// lote y la nota de crédito.
export const sendWithLookup = async (
  payload: IssuePayload,
  deps: SendDeps,
  waitTurn: () => Promise<void>
): Promise<SendOutcome> => {
  const lookup = async () => {
    try {
      return await deps.findByInternalNumber(payload.numero_interno);
    } catch {
      return "error" as const;
    }
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await waitTurn();
    try {
      return { cfe: await deps.issuer.issue(payload), kind: "issued" };
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

// Una factura del lote: se arma y se manda.
const issueOne = async (
  candidate: IssueCandidate,
  deps: IssueRunDeps,
  waitTurn: () => Promise<void>
): Promise<IssueOutcome> => {
  // Las fechas elegidas en el editor (49) o las de por defecto (50): el día
  // en que se emite o el 1 del mes del borrador, y vence el 10.
  const dates = resolveDraftDates({
    explicitDue: candidate.dueDate ?? null,
    explicitIssue: candidate.issueDate,
    paymentForm: candidate.paymentForm ?? PAYMENT_FORM.CASH,
    period: candidate.period,
    today: getIssueDay(deps.now()),
  });
  const plan = buildIssuePlan({ ...candidate, dueDate: dates.dueDate }, dates.issueDate);
  if (!plan.ok) return { kind: "failed", message: plan.error };
  const sent = await sendWithLookup(plan.payload, deps, waitTurn);
  return sent.kind === "issued"
    ? { cfe: sent.cfe, dueDate: plan.dueDate, issueDate: plan.issueDate, kind: "issued", paymentForm: plan.paymentForm }
    : sent;
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

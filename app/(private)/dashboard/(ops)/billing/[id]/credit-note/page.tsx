import { notFound } from "next/navigation";

import { CreditNotePage } from "@/components/billing/credit-note/credit-note-page";
import { parseAmountsParam } from "@/components/billing/credit-note/credit-note-model";
import { getCreditNoteView } from "@/data/billing/credit-note";
import { CREDIT_REASON_MAX } from "@/lib/billing/credit-note-plan";

// Emitir una nota espera la respuesta de Biller (y una búsqueda por número
// interno si la respuesta no es clara): hasta ~100 s.
export const maxDuration = 120;

type Search = { amounts?: string; mode?: string; reason?: string };

// Nota de crédito de una factura emitida (docs/billing.md, feature 43). Solo
// admin: la lectura y la acción vuelven a pedir la sesión. El agente puede
// abrirla con ?mode=partial&amounts=0:1200&reason=… ya puestos.
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const view = await getCreditNoteView(id);
  if (!view) notFound();

  const amounts = parseAmountsParam(search.amounts);
  const initial = {
    amounts,
    mode: search.mode === "partial" || (search.mode !== "full" && view.credited > 0) ? ("partial" as const) : ("full" as const),
    reason: (search.reason ?? "").slice(0, CREDIT_REASON_MAX),
  };
  return <CreditNotePage initial={initial} key={view.notes.length} view={view} />;
}

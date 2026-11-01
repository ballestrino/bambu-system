"use client";

import { Check, Loader2, Minus } from "lucide-react";

import { getMonthName, pluralInvoices } from "@/components/billing/billing-format";
import type { BillingMonthView } from "@/data/billing/month";
import type { RepeatSkipKind } from "@/lib/billing/draft-repeat";

const SKIP_LABELS: Record<RepeatSkipKind, (count: number, month: string, prevMonth: string) => string> = {
  billed: (count, month) => `${count} ${count === 1 ? "ya facturada" : "ya facturadas"} en ${month}`,
  annulled: (count, _month, prevMonth) => `${count} ${count === 1 ? "anulada" : "anuladas"} en ${prevMonth}`,
  note: (count) => `${count} ${count === 1 ? "nota" : "notas"} de crédito o débito`,
  no_items: (count) => `${count} sin ítems en la copia de Biller`,
};

// Sin borrador: "Repetir <mes anterior>" y qué va a quedar marcado.
export const BillingEmptyDraft = ({
  canRepeat,
  isRepeating,
  onRepeat,
  view,
}: {
  canRepeat: boolean;
  isRepeating: boolean;
  onRepeat: () => void;
  view: BillingMonthView;
}) => {
  const month = getMonthName(view.period);
  const prevMonth = getMonthName(view.previousPeriod);
  const { selected, skipped, total } = view.repeatPreview;
  const skipEntries = Object.entries(skipped) as [RepeatSkipKind, number][];

  return (
    <section className="flex flex-wrap items-center justify-center gap-8 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface px-[18px] py-6 md:px-6 md:py-12">
      <div className="flex max-w-[420px] flex-col gap-2.5">
        <h2 className="text-[17px] font-semibold tracking-tight text-ops-text md:text-[22px]">Armá {month} en un paso</h2>
        <p className="text-sm leading-normal text-ops-text-muted md:text-[15px]">
          {total
            ? `Se repiten ${total === 1 ? "la factura" : `las ${total} facturas`} de ${prevMonth} con los mismos clientes, ítems, adenda y forma de pago. El mes del detalle pasa a ${month}.`
            : `${capitalize(prevMonth)} no tiene facturas emitidas para repetir.`}
        </p>
        <button
          className="mt-2 flex h-12 items-center justify-center gap-2 self-stretch rounded-xl bg-ops-bamboo-strong px-[18px] text-[15px] font-semibold text-white disabled:opacity-60 md:h-11 md:self-start md:rounded-[10px] dark:text-ops-canvas"
          disabled={!canRepeat || !total || isRepeating}
          onClick={onRepeat}
          type="button"
        >
          {isRepeating ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {isRepeating ? "Copiando de Biller…" : `Repetir ${prevMonth}`}
        </button>
        {!canRepeat ? <p className="text-[13px] text-ops-text-muted">Configurá Biller para repetir el mes.</p> : null}
      </div>
      {total ? (
        <ul className="flex w-full flex-col gap-2 text-[13px] md:w-[280px]">
          <li className="flex items-center gap-2.5 rounded-[10px] bg-ops-bamboo-soft px-3 py-2.5 text-ops-bamboo-strong">
            <Check aria-hidden className="size-4" strokeWidth={2.4} />
            {pluralInvoices(selected)} {selected === 1 ? "va marcada" : "van marcadas"}
          </li>
          {skipEntries.map(([kind, count]) => (
            <li className="flex items-center gap-2.5 rounded-[10px] bg-zinc-100 px-3 py-2.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200" key={kind}>
              <Minus aria-hidden className="size-4" />
              {SKIP_LABELS[kind](count, month, prevMonth)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

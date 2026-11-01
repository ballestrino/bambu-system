import { NextResponse } from "next/server";

import { describeBillerError } from "@/lib/billing/biller-errors";
import { getBillerStatus, syncBillingPeriod } from "@/lib/billing/biller-server";
import { addBillingMonths, getBillingPeriodKey, getCurrentBillingPeriod } from "@/lib/billing/billing-month";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cron diario de Vercel (vercel.json): copia de Biller el mes actual y el
// anterior, que trae el estado ante DGI de lo pendiente y reconcilia por
// numero_interno lo que quedó sin confirmar. Solo lee de Biller.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  if (!getBillerStatus().configured) return NextResponse.json({ ok: true, skipped: "Biller sin configurar" });

  try {
    const current = getCurrentBillingPeriod(new Date());
    const results: Record<string, unknown> = {};
    for (const period of [addBillingMonths(current, -1), current]) {
      results[getBillingPeriodKey(period)] = await syncBillingPeriod(period);
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("Error in billing sync cron:", error);
    return NextResponse.json({ ok: false, error: describeBillerError(error) }, { status: 500 });
  }
}

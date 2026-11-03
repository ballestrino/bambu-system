import { NextResponse } from "next/server";

import { describeBillerError } from "@/lib/billing/biller-errors";
import { getBillerInvoicePdf } from "@/lib/billing/biller-server";
import { getInvoicePdfName } from "@/lib/billing/invoice-delivery";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";

export const runtime = "nodejs";

// El PDF de un comprobante emitido, pedido a Biller en el momento. Solo admin.
// Con ?download=1 se descarga sin abrirlo (feature 53).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: { billerId: true, cfeType: true, number: true, series: true },
    });
    if (!invoice?.billerId) return NextResponse.json({ error: "El comprobante no está emitido" }, { status: 404 });

    const pdf = await getBillerInvoicePdf(invoice.billerId);
    const name = getInvoicePdfName(invoice);
    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${disposition}; filename="${name}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return NextResponse.json({ error: error.message }, { status: 403 });
    console.error("Error reading Biller PDF:", error);
    return NextResponse.json({ error: describeBillerError(error) }, { status: 502 });
  }
}

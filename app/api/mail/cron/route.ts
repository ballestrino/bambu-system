import { NextResponse } from "next/server";

import { processMailAutoReplyQueue } from "@/lib/mail-agent/automation";
import { requireMailCronSecret } from "@/lib/mail-agent/config";
import { syncSharedMailbox } from "@/lib/mail-agent/sync";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    requireMailCronSecret(request.headers.get("authorization"));
    const sync = await syncSharedMailbox("cron");
    const queue = await processMailAutoReplyQueue();
    return NextResponse.json({ ok: true, sync, queue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de correo";
    const unauthorized = message.includes("no autorizado");
    return NextResponse.json(
      { ok: false, error: message },
      { status: unauthorized ? 401 : 500 }
    );
  }
}

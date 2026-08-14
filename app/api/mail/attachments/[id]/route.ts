import { downloadMailAttachment } from "@/lib/mail-agent/download-attachment";
import { requireAdminSession } from "@/lib/require-admin-session";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const attachment = await downloadMailAttachment(id);
    const safeName = attachment.filename.replace(/[\r\n"\\/]/g, "-");
    return new Response(attachment.content, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(attachment.content.length),
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo descargar";
    return Response.json({ error: message }, { status: 404 });
  }
}

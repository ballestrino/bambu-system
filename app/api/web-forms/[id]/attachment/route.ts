import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";
import { webFormIdSchema } from "@/schemas/web-forms";

// Descarga el CV de un formulario web. Solo admins, siempre como adjunto: un
// archivo que mandó cualquiera no se abre dentro de la app.
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return new Response(null, { status: 403 });
  }

  const id = webFormIdSchema.safeParse((await params).id);
  if (!id.success) return new Response(null, { status: 404 });
  const attachment = await db.webFormAttachment.findUnique({
    where: { submissionId: id.data },
    select: { filename: true, mimeType: true, data: true },
  });
  if (!attachment) return new Response(null, { status: 404 });

  const asciiName = attachment.filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new Response(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { AGENT_ATTACHMENT_ID_PATTERN } from "@/lib/agent/attachment-rules";
import { getOwnedAttachment } from "@/lib/agent/attachment-store";
import { requireAdminSession } from "@/lib/require-admin-session";

// Sirve una imagen adjunta solo a quien la subió. No cambia nunca (un id por
// imagen): el navegador la guarda en su caché privado.
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return new Response(null, { status: 403 });
  }

  const { id } = await params;
  if (!AGENT_ATTACHMENT_ID_PATTERN.test(id)) return new Response(null, { status: 404 });
  const attachment = await getOwnedAttachment(id, session.user.id);
  if (!attachment) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mediaType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

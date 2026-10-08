import {
  AGENT_IMAGE_MAX_BYTES,
  agentAttachmentUrl,
  IMAGE_TOO_LARGE_MESSAGE,
} from "@/lib/agent/attachment-rules";
import { createAgentAttachment } from "@/lib/agent/attachment-store";
import { detectImageMediaType } from "@/lib/agent/image-signature";
import { requireAdminSession } from "@/lib/require-admin-session";
import { agentAttachmentFieldsSchema } from "@/schemas/agent";

// Sube una imagen del composer, ya achicada por el navegador. Una por pedido:
// así ninguno se acerca al corte de 4,5 MB de Vercel, aunque el mensaje lleve
// siete. Queda sin mensaje hasta que se envía.
export const runtime = "nodejs";

const jsonError = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return jsonError("Necesitás iniciar sesión como administrador", 403);
  }

  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  if (!form || !(image instanceof Blob) || image.size === 0) return jsonError("Falta la imagen", 400);
  if (image.size > AGENT_IMAGE_MAX_BYTES) return jsonError(IMAGE_TOO_LARGE_MESSAGE, 413);
  const fields = agentAttachmentFieldsSchema.safeParse({
    width: form.get("width"),
    height: form.get("height"),
    filename: form.get("filename") ?? undefined,
  });
  if (!fields.success) return jsonError("Pedido inválido", 400);

  const data = new Uint8Array(await image.arrayBuffer());
  const mediaType = detectImageMediaType(data);
  if (!mediaType) return jsonError("El archivo no es una imagen JPEG, PNG o WEBP.", 415);

  try {
    const attachment = await createAgentAttachment({
      userId: session.user.id,
      mediaType,
      filename: fields.data.filename || null,
      width: fields.data.width,
      height: fields.data.height,
      data,
    });
    return Response.json({ ...attachment, url: agentAttachmentUrl(attachment.id) }, { status: 201 });
  } catch (error) {
    console.error("Agent attachment upload failed:", error);
    return jsonError("No se pudo guardar la imagen. Probá de nuevo.", 500);
  }
}

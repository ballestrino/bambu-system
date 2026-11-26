import { NextResponse } from "next/server";

import { checkCvFile, WEB_FORM_MAX_FILE_BYTES } from "@/lib/web-forms/file-type";
import { getWebFormsSecret, isWebFormsRequestAuthorized } from "@/lib/web-forms/inbound-secret";
import { storeWebFormSubmission, webFormUrl } from "@/lib/web-forms/store-submission";
import { webFormInboundSchema } from "@/schemas/web-forms";

// Entrada de los formularios de la web pública (bambu-servicios.com). Es una
// integración externa: la llama el servidor de la web, nunca un navegador, con
// WEB_FORMS_SECRET. Pública en routes.ts; la autorización es el secreto.
export const runtime = "nodejs";

// Lo que acepta Vercel por pedido (4,5 MB) alcanza para el CV y los campos.
const MAX_BODY_BYTES = WEB_FORM_MAX_FILE_BYTES + 256 * 1024;

const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

const readText = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
};

export async function POST(request: Request) {
  if (!isWebFormsRequestAuthorized(request.headers.get("authorization"), getWebFormsSecret())) {
    return fail(401, "No autorizado");
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return fail(413, "El envío supera los 4 MB");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Se esperaba multipart/form-data");
  }

  const parsed = webFormInboundSchema.safeParse({
    externalId: readText(form, "externalId"),
    kind: readText(form, "kind"),
    name: readText(form, "name"),
    email: readText(form, "email"),
    phone: readText(form, "phone"),
    service: readText(form, "service"),
    location: readText(form, "location"),
    message: readText(form, "message"),
    fromTrebol: readText(form, "fromTrebol"),
  });
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Formulario inválido");

  const file = form.get("curriculum");
  let cv = null;
  if (parsed.data.kind === "JOB_APPLICATION") {
    if (!(file instanceof File)) return fail(400, "Falta el CV");
    const checked = checkCvFile(file.name, new Uint8Array(await file.arrayBuffer()));
    if (!checked.ok) return fail(400, checked.error);
    cv = checked;
  }

  try {
    const stored = await storeWebFormSubmission(parsed.data, cv);
    return NextResponse.json(
      { ok: true, id: stored.id, url: webFormUrl(stored.id), duplicate: !stored.created },
      { status: stored.created ? 201 : 200 }
    );
  } catch (error) {
    console.error("Error al guardar un formulario web:", error);
    return fail(500, "No se pudo guardar el formulario");
  }
}

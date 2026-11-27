"use server";

import { countNewWebForms, getWebForm, listWebForms } from "@/data/web-forms";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { sendWebFormReply } from "@/lib/web-forms/send-reply";
import {
  listWebFormsSchema,
  replyWebFormSchema,
  setWebFormStatusSchema,
  webFormIdSchema,
} from "@/schemas/web-forms";

// La pantalla de Formularios web: cualquier admin lee, responde y archiva.
const toError = (error: unknown, fallback: string) => {
  if (error instanceof AdminAuthorizationError) return { error: error.message };
  console.error(`${fallback}:`, error);
  return { error: fallback };
};

const NOT_FOUND = { error: "Ese formulario ya no existe" };

export const getWebForms = async (input: unknown) => {
  try {
    const parsed = listWebFormsSchema.safeParse(input ?? {});
    if (!parsed.success) return { error: "Filtros inválidos" };
    return await listWebForms(parsed.data);
  } catch (error) {
    return toError(error, "No se pudieron leer los formularios");
  }
};

// Abrirlo lo marca como leído la primera vez.
export const getWebFormDetail = async (formId: unknown) => {
  try {
    const id = webFormIdSchema.safeParse(formId);
    if (!id.success) return NOT_FOUND;
    const form = await getWebForm(id.data);
    if (!form) return NOT_FOUND;
    if (!form.readAt) {
      const readAt = new Date();
      await db.webFormSubmission.updateMany({ where: { id: id.data, readAt: null }, data: { readAt } });
      return { form: { ...form, readAt } };
    }
    return { form };
  } catch (error) {
    return toError(error, "No se pudo leer el formulario");
  }
};

export const getNewWebFormsCount = async () => {
  try {
    return { count: await countNewWebForms() };
  } catch (error) {
    return toError(error, "No se pudo contar los formularios");
  }
};

const STATUS_MESSAGES = {
  NEW: "Volvió a Nuevos",
  REPLIED: "Marcado como respondido",
  ARCHIVED: "Archivado",
} as const;

export const setWebFormStatus = async (input: unknown): Promise<{ success: string } | { error: string }> => {
  try {
    const session = await requireAdminSession();
    const parsed = setWebFormStatusSchema.safeParse(input);
    if (!parsed.success) return { error: "Estado inválido" };
    const { id, status } = parsed.data;
    const handled = status === "NEW" ? { handledById: null, handledAt: null } : { handledById: session.user.id, handledAt: new Date() };
    const { count } = await db.webFormSubmission.updateMany({ where: { id }, data: { status, ...handled } });
    if (!count) return NOT_FOUND;
    return { success: STATUS_MESSAGES[status] };
  } catch (error) {
    return toError(error, "No se pudo cambiar el estado");
  }
};

export const replyWebForm = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = replyWebFormSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      // Los mensajes propios (vacío, largo) son "custom"; el resto del
      // documento es un formato que el servidor no reconoce.
      const badFormat = issue?.path[0] === "content" && issue.code !== "custom";
      return { error: badFormat ? "No se pudo leer el formato del mensaje. Probá sacarle el formato." : issue?.message ?? "Respuesta inválida" };
    }
    return await sendWebFormReply(parsed.data, session.user.id);
  } catch (error) {
    return toError(error, "No se pudo mandar la respuesta");
  }
};

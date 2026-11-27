"use server";

import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { classifyNewRequestsWithAi } from "@/lib/web-forms/classify-cvs";
import { sortWebFormMail } from "@/lib/web-forms/sort-mail";
import { setWebFormKindSchema, sortWebFormMailSchema } from "@/schemas/web-forms";

// Ordenar formularios (feature 75): pasarlos de pestaña, Detectar currículums
// con Haiku y mover los avisos del buzón de contacto@ a su carpeta.
const toError = (error: unknown, fallback: string) => {
  if (error instanceof AdminAuthorizationError) return { error: error.message };
  console.error(`${fallback}:`, error);
  return { error: fallback };
};

const KIND_MESSAGES = {
  CONTACT: "Pasó a Pedidos de servicio",
  JOB_APPLICATION: "Pasó a Currículums",
} as const;

export const setWebFormKind = async (input: unknown): Promise<{ success: string } | { error: string }> => {
  try {
    await requireAdminSession();
    const parsed = setWebFormKindSchema.safeParse(input);
    if (!parsed.success) return { error: "Tipo inválido" };
    const { id, kind } = parsed.data;
    const { count } = await db.webFormSubmission.updateMany({ where: { id }, data: { kind } });
    if (!count) return { error: "Ese formulario ya no existe" };
    return { success: KIND_MESSAGES[kind] };
  } catch (error) {
    return toError(error, "No se pudo cambiar el tipo");
  }
};

export const detectCurriculums = async () => {
  try {
    const session = await requireAdminSession();
    return await classifyNewRequestsWithAi(session.user.id);
  } catch (error) {
    return toError(error, "No se pudieron revisar los pedidos con IA");
  }
};

export const moveWebFormMail = async (input: unknown) => {
  try {
    await requireAdminSession();
    const parsed = sortWebFormMailSchema.safeParse(input);
    if (!parsed.success) return { error: "Carpeta inválida" };
    return await sortWebFormMail(parsed.data.kind);
  } catch (error) {
    return toError(error, "No se pudieron mover los correos");
  }
};

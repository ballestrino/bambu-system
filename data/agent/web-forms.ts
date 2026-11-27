import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// El formulario web en contexto, para fillWebFormReply (feature 75): solo lo
// que necesita su tarjeta. Solo lectura.
export const getAgentWebForm = async (id: string) => {
  await requireAdminSession();
  return db.webFormSubmission.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
};

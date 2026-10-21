import "server-only";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// Las empleadas que una propuesta de visitas quiere asignar, archivadas o no:
// la tool y las precondiciones deciden.
export const getAgentVisitEmployees = async (ids: string[]) => {
  await requireAdminSession();
  if (!ids.length) return [];

  return db.employee.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true, name: true, isActive: true, archivedAt: true },
  });
};

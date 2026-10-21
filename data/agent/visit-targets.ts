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

// El trabajo de un lote de visitas, archivado o no, con las asignaciones que
// dan su equipo (las mismas que lee "Generar visitas").
export const getAgentVisitJob = async (jobId: string) => {
  await requireAdminSession();

  return db.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      name: true,
      status: true,
      archivedAt: true,
      assignments: {
        where: { archivedAt: null },
        select: { assignedFrom: true, assignedTo: true, employeeId: true },
      },
    },
  });
};

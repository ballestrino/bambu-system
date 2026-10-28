"use server";

import { opsJobListInclude } from "@/data/ops/includes";
import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import { requireAdminSession } from "@/lib/require-admin-session";
import { SetJobsStatusSchema } from "@/schemas/ops";

// Reactivar, pausar o archivar varios trabajos desde la tabla: se cambian
// todos o ninguno. Reactivar o pausar un archivado lo saca del archivo.
export const setJobsStatus = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsedValues = SetJobsStatusSchema.safeParse(values);
    if (!parsedValues.success) {
      return { error: "Datos invalidos para cambiar los trabajos" };
    }

    const jobIds = [...new Set(parsedValues.data.jobIds)];
    const { status } = parsedValues.data;

    const jobs = await db.$transaction(async (tx) => {
      const result = await tx.job.updateMany({
        where: { id: { in: jobIds } },
        data: {
          status,
          archivedAt: status === "ARCHIVED" ? new Date() : null,
          updatedById: session.user.id,
        },
      });

      if (result.count !== jobIds.length) {
        throw new Error("Alguno de los trabajos ya no existe");
      }

      return tx.job.findMany({
        where: { id: { in: jobIds } },
        include: opsJobListInclude,
      });
    });

    return { success: "Trabajos actualizados", jobs };
  } catch (error) {
    console.error("Error setting jobs status:", error);
    return {
      error: getActionErrorMessage(error, "Error al cambiar los trabajos"),
    };
  }
};

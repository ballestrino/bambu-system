"use server";

import { getEmployees } from "@/data/ops";
import ValidationError from "@/instances/validation-error";
import type { EmployeeFilters } from "@/schemas/ops";

export const getEmployeesAction = async (filters?: EmployeeFilters) => {
  try {
    const result = await getEmployees(filters);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.employees;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al obtener las empleadas");
  }
};

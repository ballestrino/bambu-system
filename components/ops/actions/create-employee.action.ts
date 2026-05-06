"use server";

import { createEmployee } from "@/actions/ops";
import ValidationError from "@/instances/validation-error";
import type { CreateEmployeeInput } from "@/schemas/ops";

export const createEmployeeAction = async (values: CreateEmployeeInput) => {
  try {
    const result = await createEmployee(values);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.employee;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al crear la empleada");
  }
};

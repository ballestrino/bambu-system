"use server";

import { getPaidEmployeeIds } from "@/data/ops";
import ValidationError from "@/instances/validation-error";

export const getPaidEmployeeIdsAction = async (input: {
  employeeIds: string[];
  paymentMonthKey: string;
}) => {
  try {
    const result = await getPaidEmployeeIds(input);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    return result.employeeIds ?? [];
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new Error("Error al revisar los pagos");
  }
};

import "server-only";

import { AdminAuthorizationError } from "@/lib/require-admin-session";

export const getActionErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AdminAuthorizationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

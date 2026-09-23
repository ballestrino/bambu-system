import "server-only";

import {
  AdminAuthorizationError,
  requireAdminSession,
} from "@/lib/require-admin-session";

// Budgets and budget categories are one workspace shared by every admin (see
// docs/architecture.md): any admin reads and writes any budget, and
// Budget.userId records who created it. Returns the admin session or the
// { error } that budget reads and actions give back.
type BudgetAdminSession =
  | { session: Awaited<ReturnType<typeof requireAdminSession>> }
  | { error: string };

export const getBudgetAdminSession = async (): Promise<BudgetAdminSession> => {
  try {
    return { session: await requireAdminSession() };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    throw error;
  }
};

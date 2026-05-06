import { auth } from "@/auth";
import type { Session } from "next-auth";

export class AdminAuthorizationError extends Error {
  constructor(message = "Necesitas iniciar sesión como administrador") {
    super(message);
    this.name = "AdminAuthorizationError";
  }
}

type AdminSession = Session & {
  user: Session["user"] & {
    id: string;
    role: "ADMIN";
  };
};

export const requireAdminSession = async (): Promise<AdminSession> => {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new AdminAuthorizationError();
  }

  return session as AdminSession;
};

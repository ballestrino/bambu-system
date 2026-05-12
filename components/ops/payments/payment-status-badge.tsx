import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@prisma/client";

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge variant={status === "RECORDED" ? "default" : "secondary"}>
    {status === "RECORDED" ? "Registrado" : "Anulado"}
  </Badge>
);

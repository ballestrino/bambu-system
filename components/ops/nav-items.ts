import {
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
  ReceiptText,
  UsersRound,
  WalletCards,
} from "lucide-react";

export const opsNavItems = [
  {
    title: "Inicio",
    description: "Resumen operativo diario",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Trabajos",
    description: "Servicios activos y archivo operativo",
    url: "/dashboard/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Visitas",
    description: "Calendario, cronograma semanal e historial",
    url: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Empleados",
    description: "Equipo, horas y asignaciones",
    url: "/dashboard/employees",
    icon: UsersRound,
  },
  {
    title: "Finanzas",
    description: "Cobros, costes y pagos a empleadas",
    url: "/dashboard/financial",
    icon: WalletCards,
  },
  {
    title: "Facturación",
    description: "Facturas de Biller y borrador del mes",
    url: "/dashboard/billing",
    icon: ReceiptText,
  },
] as const;

export const isOpsNavItemActive = (pathname: string, url: string) =>
  url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);

import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  HandCoins,
  UsersRound,
} from "lucide-react";

export const opsNavItems = [
  {
    title: "Trabajos",
    description: "Servicios activos y archivo operativo",
    url: "/dashboard/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Calendario",
    description: "Agenda y visitas del equipo",
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
    title: "Cobros",
    description: "Ingresos recibidos de clientes",
    url: "/dashboard/payments",
    icon: CircleDollarSign,
  },
  {
    title: "Pagos",
    description: "Pagos y periodos de empleadas",
    url: "/dashboard/payroll",
    icon: HandCoins,
  },
] as const;

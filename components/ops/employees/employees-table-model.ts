import { getHourlyRateNumber } from "@/components/ops/employees/employee-payroll";
import type { OpsEmployee } from "@/components/ops/types";

export type EmployeeStateFilter = "active" | "inactive" | "all";
export type EmployeeSortKey = "name" | "rate";
export type EmployeeSort = { key: EmployeeSortKey; dir: 1 | -1 };

export const employeeStateOptions: { value: EmployeeStateFilter; label: string }[] = [
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
  { value: "all", label: "Todos" },
];

export const toEmployeeStateFilter = (value: string): EmployeeStateFilter =>
  value === "inactive" || value === "all" ? value : "active";

// El servidor trae activas e inactivas juntas (con la búsqueda y archivados ya
// aplicados); el estado se filtra acá para poder contar cada pestaña.
export const countEmployeesByState = (employees: OpsEmployee[]) => {
  const active = employees.filter((employee) => employee.isActive).length;
  return { active, inactive: employees.length - active, all: employees.length };
};

export const filterEmployeesByState = (
  employees: OpsEmployee[],
  state: EmployeeStateFilter
) =>
  state === "all"
    ? employees
    : employees.filter((employee) => employee.isActive === (state === "active"));

const nameCompare = (a: OpsEmployee, b: OpsEmployee) =>
  a.name.localeCompare(b.name, "es", { sensitivity: "base" });

// Sin tarifa queda abajo al ordenar de menor a mayor, como en el diseño.
export const sortEmployeeRows = (employees: OpsEmployee[], sort: EmployeeSort) =>
  [...employees].sort((a, b) => {
    if (sort.key === "name") return nameCompare(a, b) * sort.dir;
    const rateA = getHourlyRateNumber(a.hourlyRate) ?? -1;
    const rateB = getHourlyRateNumber(b.hourlyRate) ?? -1;
    return (rateA - rateB) * sort.dir || nameCompare(a, b);
  });

export const nextEmployeeSort = (
  current: EmployeeSort,
  key: EmployeeSortKey
): EmployeeSort => ({ key, dir: current.key === key ? (current.dir === 1 ? -1 : 1) : 1 });

export const employeeInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// Como en el diseño: "$ 420/h", con centavos solo si los hay.
const rateFormat = (fractionDigits: number) =>
  new Intl.NumberFormat("es-UY", {
    currency: "UYU",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    style: "currency",
  });
const wholeRateFormat = rateFormat(0);
const centsRateFormat = rateFormat(2);

export const formatEmployeeRate = (value: unknown) => {
  const rate = getHourlyRateNumber(value);
  if (rate === null) return null;
  return `${(Number.isInteger(rate) ? wholeRateFormat : centsRateFormat).format(rate)}/h`;
};

export const employeeStatus = (employee: OpsEmployee) =>
  employee.archivedAt ? "Archivado" : employee.isActive ? "Activo" : "Inactivo";

export const employeesCountLabel = (count: number) =>
  `${count} ${count === 1 ? "empleado" : "empleados"}`;

const csvCell = (value: string | number | null) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export const buildEmployeesCsv = (employees: OpsEmployee[]) =>
  [
    ["Nombre", "Teléfono", "Email", "Tarifa por hora", "Estado", "Notas"],
    ...employees.map((employee) => [
      employee.name,
      employee.phone,
      employee.email,
      getHourlyRateNumber(employee.hourlyRate)?.toFixed(2) ?? "",
      employeeStatus(employee),
      employee.notes,
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

"use client";

import type { OpsEmployee } from "@/components/ops/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PayrollFilters = ({
  employeeId,
  employees,
  endDate,
  onEmployeeIdChange,
  onEndDateChange,
  onStartDateChange,
  onStatusChange,
  startDate,
  status,
}: {
  employeeId: string;
  employees: OpsEmployee[];
  endDate: string;
  onEmployeeIdChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  startDate: string;
  status: string;
}) => (
  <div className="grid gap-3 rounded-lg border bg-white/80 p-4 shadow-sm ring-1 ring-black/5 md:grid-cols-4">
    <div className="space-y-2">
      <Label>Periodo desde</Label>
      <Input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
    </div>
    <div className="space-y-2">
      <Label>Periodo hasta</Label>
      <Input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
    </div>
    <div className="space-y-2">
      <Label>Estado</Label>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="RECORDED">Registrados</SelectItem>
          <SelectItem value="VOIDED">Anulados</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Empleado</Label>
      <Select value={employeeId} onValueChange={onEmployeeIdChange}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          {employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  </div>
);

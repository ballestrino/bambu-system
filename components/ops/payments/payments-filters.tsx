"use client";

import type { OpsJobListItem } from "@/components/ops/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PaymentsFilters = ({
  endDate,
  jobId,
  jobs,
  onEndDateChange,
  onJobIdChange,
  onStartDateChange,
  onStatusChange,
  startDate,
  status,
}: {
  endDate: string;
  jobId: string;
  jobs: OpsJobListItem[];
  onEndDateChange: (value: string) => void;
  onJobIdChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  startDate: string;
  status: string;
}) => (
  <div className="grid gap-3 rounded-lg border bg-white/80 p-4 shadow-sm ring-1 ring-black/5 md:grid-cols-4">
    <div className="space-y-2">
      <Label>Desde</Label>
      <Input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
    </div>
    <div className="space-y-2">
      <Label>Hasta</Label>
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
      <Label>Trabajo</Label>
      <Select value={jobId} onValueChange={onJobIdChange}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          {jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  </div>
);

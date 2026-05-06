"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { jobStatusValues } from "@/schemas/ops";

interface JobFiltersProps {
  query: string;
  status: string;
  includeArchived: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onIncludeArchivedChange: (value: boolean) => void;
}

export const JobFilters = ({
  query,
  status,
  includeArchived,
  onQueryChange,
  onStatusChange,
  onIncludeArchivedChange,
}: JobFiltersProps) => (
  <div className="grid gap-3 rounded-lg border bg-background/80 p-4 md:grid-cols-[1fr_180px_auto]">
    <div className="relative">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar por nombre, descripción o ubicación"
        className="pl-9"
      />
    </div>
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Todos los estados" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los estados</SelectItem>
        {jobStatusValues.map((value) => (
          <SelectItem key={value} value={value}>
            {value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
      <Switch checked={includeArchived} onCheckedChange={onIncludeArchivedChange} />
      Incluir archivados
    </label>
  </div>
);

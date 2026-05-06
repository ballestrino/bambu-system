"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const EmployeeFilters = ({
  query,
  activeFilter,
  includeArchived,
  onQueryChange,
  onActiveFilterChange,
  onIncludeArchivedChange,
}: {
  query: string;
  activeFilter: string;
  includeArchived: boolean;
  onQueryChange: (value: string) => void;
  onActiveFilterChange: (value: string) => void;
  onIncludeArchivedChange: (value: boolean) => void;
}) => (
  <div className="grid gap-3 rounded-lg border bg-background/80 p-4 md:grid-cols-[1fr_170px_auto]">
    <div className="relative">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar por nombre, email, teléfono o notas"
        className="pl-9"
      />
    </div>
    <Select value={activeFilter} onValueChange={onActiveFilterChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value="active">Activos</SelectItem>
        <SelectItem value="inactive">Inactivos</SelectItem>
      </SelectContent>
    </Select>
    <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
      <Switch checked={includeArchived} onCheckedChange={onIncludeArchivedChange} />
      Incluir archivados
    </label>
  </div>
);

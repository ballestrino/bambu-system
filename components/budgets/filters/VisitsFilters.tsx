import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface VisitsFiltersProps {
    visitType: string
    setVisitType: (val: string) => void
    minVisits: string
    setMinVisits: (val: string) => void
    maxVisits: string
    setMaxVisits: (val: string) => void
    minHoursPerVisit: string
    setMinHoursPerVisit: (val: string) => void
    maxHoursPerVisit: string
    setMaxHoursPerVisit: (val: string) => void
}

export function VisitsFilters({
    visitType,
    setVisitType,
    minVisits,
    setMinVisits,
    maxVisits,
    setMaxVisits,
    minHoursPerVisit,
    setMinHoursPerVisit,
    maxHoursPerVisit,
    setMaxHoursPerVisit
}: VisitsFiltersProps) {
    return (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="grid gap-2">
                <Label>Tipo de Visita</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                    <SelectTrigger className="h-8">
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Variables</SelectItem>
                        <SelectItem value="days">Días</SelectItem>
                        <SelectItem value="week">Semanas</SelectItem>
                        <SelectItem value="month">Meses</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label>Cantidad de Visitas</Label>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Min"
                        type="number"
                        value={minVisits}
                        onChange={(e) => setMinVisits(e.target.value)}
                        className="h-8"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        placeholder="Max"
                        type="number"
                        value={maxVisits}
                        onChange={(e) => setMaxVisits(e.target.value)}
                        className="h-8"
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Horas por Visita</Label>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Min"
                        type="number"
                        value={minHoursPerVisit}
                        onChange={(e) => setMinHoursPerVisit(e.target.value)}
                        className="h-8"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        placeholder="Max"
                        type="number"
                        value={maxHoursPerVisit}
                        onChange={(e) => setMaxHoursPerVisit(e.target.value)}
                        className="h-8"
                    />
                </div>
            </div>
        </div>
    )
}

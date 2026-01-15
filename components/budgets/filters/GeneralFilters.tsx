import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface GeneralFiltersProps {
    startDate: Date | undefined
    setStartDate: (date: Date | undefined) => void
    endDate: Date | undefined
    setEndDate: (date: Date | undefined) => void
    hasProducts: boolean | undefined
    setHasProducts: (val: boolean | undefined) => void
}

export function GeneralFilters({
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    hasProducts,
    setHasProducts
}: GeneralFiltersProps) {
    return (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="grid gap-2">
                <Label>Fecha de Actualización</Label>
                <div className="flex flex-col gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP", { locale: es }) : <span>Desde</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                            />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP", { locale: es }) : <span>Hasta</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="has-products"
                    checked={hasProducts === true}
                    onCheckedChange={(checked) => setHasProducts(checked ? true : undefined)}
                />
                <Label htmlFor="has-products">Solo con productos</Label>
            </div>
        </div>
    )
}

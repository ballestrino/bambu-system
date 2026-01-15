import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PricesFiltersProps {
    minPrice: string
    setMinPrice: (val: string) => void
    maxPrice: string
    setMaxPrice: (val: string) => void
    minProfit: string
    setMinProfit: (val: string) => void
    maxProfit: string
    setMaxProfit: (val: string) => void
    minNominalHour: string
    setMinNominalHour: (val: string) => void
    maxNominalHour: string
    setMaxNominalHour: (val: string) => void
}

export function PricesFilters({
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    minProfit,
    setMinProfit,
    maxProfit,
    setMaxProfit,
    minNominalHour,
    setMinNominalHour,
    maxNominalHour,
    setMaxNominalHour
}: PricesFiltersProps) {
    return (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
            <div className="grid gap-2">
                <Label>Precio Final</Label>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Min"
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="h-8"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        placeholder="Max"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="h-8"
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Ganancia</Label>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Min"
                        type="number"
                        value={minProfit}
                        onChange={(e) => setMinProfit(e.target.value)}
                        className="h-8"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        placeholder="Max"
                        type="number"
                        value={maxProfit}
                        onChange={(e) => setMaxProfit(e.target.value)}
                        className="h-8"
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Hora Nominal</Label>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Min"
                        type="number"
                        value={minNominalHour}
                        onChange={(e) => setMinNominalHour(e.target.value)}
                        className="h-8"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        placeholder="Max"
                        type="number"
                        value={maxNominalHour}
                        onChange={(e) => setMaxNominalHour(e.target.value)}
                        className="h-8"
                    />
                </div>
            </div>
        </div>
    )
}

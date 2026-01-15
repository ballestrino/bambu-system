"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FilterOption {
    label: string
    isActive: (params: URLSearchParams) => boolean
    toggle: (params: URLSearchParams) => void
}

export function QuickFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const createQueryString = (callback: (params: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams.toString())
        callback(params)
        // Reset page when filtering
        params.set("page", "1")
        return params.toString()
    }

    const filters: FilterOption[] = [
        {
            label: "Con productos",
            isActive: (params) => params.get("hasProducts") === "true",
            toggle: (params) => {
                if (params.get("hasProducts") === "true") {
                    params.delete("hasProducts")
                } else {
                    params.set("hasProducts", "true")
                }
            }
        },
        {
            label: "Sin productos",
            isActive: (params) => params.get("hasProducts") === "false",
            toggle: (params) => {
                if (params.get("hasProducts") === "false") {
                    params.delete("hasProducts")
                } else {
                    params.set("hasProducts", "false")
                }
            }
        },
        {
            label: "4 horas por visita",
            isActive: (params) => params.get("minHoursPerVisit") === "4" && params.get("maxHoursPerVisit") === "4",
            toggle: (params) => {
                if (params.get("minHoursPerVisit") === "4" && params.get("maxHoursPerVisit") === "4") {
                    params.delete("minHoursPerVisit")
                    params.delete("maxHoursPerVisit")
                } else {
                    params.set("minHoursPerVisit", "4")
                    params.set("maxHoursPerVisit", "4")
                }
            }
        },
        {
            label: "3 horas por visita",
            isActive: (params) => params.get("minHoursPerVisit") === "3" && params.get("maxHoursPerVisit") === "3",
            toggle: (params) => {
                if (params.get("minHoursPerVisit") === "3" && params.get("maxHoursPerVisit") === "3") {
                    params.delete("minHoursPerVisit")
                    params.delete("maxHoursPerVisit")
                } else {
                    params.set("minHoursPerVisit", "3")
                    params.set("maxHoursPerVisit", "3")
                }
            }
        },
        {
            label: "2 veces por semana",
            isActive: (params) => params.get("minVisits") === "2" && params.get("maxVisits") === "2",
            toggle: (params) => {
                if (params.get("minVisits") === "2" && params.get("maxVisits") === "2") {
                    params.delete("minVisits")
                    params.delete("maxVisits")
                } else {
                    params.set("minVisits", "2")
                    params.set("maxVisits", "2")
                }
            }
        },
        {
            label: "1 vez por semana",
            isActive: (params) => params.get("minVisits") === "1" && params.get("maxVisits") === "1",
            toggle: (params) => {
                if (params.get("minVisits") === "1" && params.get("maxVisits") === "1") {
                    params.delete("minVisits")
                    params.delete("maxVisits")
                } else {
                    params.set("minVisits", "1")
                    params.set("maxVisits", "1")
                }
            }
        },
        {
            label: "3 veces por semana",
            isActive: (params) => params.get("minVisits") === "3" && params.get("maxVisits") === "3",
            toggle: (params) => {
                if (params.get("minVisits") === "3" && params.get("maxVisits") === "3") {
                    params.delete("minVisits")
                    params.delete("maxVisits")
                } else {
                    params.set("minVisits", "3")
                    params.set("maxVisits", "3")
                }
            }
        }
    ]

    return (
        <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">

            {filters.map((filter) => {
                const active = filter.isActive(new URLSearchParams(searchParams.toString()))
                return (
                    <Badge
                        key={filter.label}
                        variant={active ? "default" : "outline"}
                        className={cn(
                            "cursor-pointer hover:bg-primary/90 transition-colors",
                            active ? "hover:bg-primary/90" : "hover:bg-muted"
                        )}
                        onClick={() => {
                            const queryString = createQueryString(filter.toggle)
                            router.push(`?${queryString}`)
                        }}
                    >
                        {filter.label}
                    </Badge>
                )
            })}
            <Button
                variant="outline"
                className="ml-auto"
                onClick={() => {
                    const queryString = createQueryString((params) => {
                        params.delete("hasProducts")
                        params.delete("minHoursPerVisit")
                        params.delete("maxHoursPerVisit")
                        params.delete("minVisits")
                        params.delete("maxVisits")
                    })
                    router.push(`?${queryString}`)
                }}
            >
                Limpiar
            </Button>
        </div>
    )
}

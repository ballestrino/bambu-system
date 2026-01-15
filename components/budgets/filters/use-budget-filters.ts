import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function useBudgetFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Filter State
    const [startDate, setStartDate] = useState<Date | undefined>(
        searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
    )
    const [endDate, setEndDate] = useState<Date | undefined>(
        searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
    )
    const [hasProducts, setHasProducts] = useState<boolean | undefined>(
        searchParams.get("hasProducts") === "true" ? true : searchParams.get("hasProducts") === "false" ? false : undefined
    )

    // Prices
    const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
    const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
    const [minProfit, setMinProfit] = useState(searchParams.get("minProfit") || "")
    const [maxProfit, setMaxProfit] = useState(searchParams.get("maxProfit") || "")
    const [minNominalHour, setMinNominalHour] = useState(searchParams.get("minNominalHour") || "")
    const [maxNominalHour, setMaxNominalHour] = useState(searchParams.get("maxNominalHour") || "")

    // Visits
    const [minVisits, setMinVisits] = useState(searchParams.get("minVisits") || "")
    const [maxVisits, setMaxVisits] = useState(searchParams.get("maxVisits") || "")
    const [minHoursPerVisit, setMinHoursPerVisit] = useState(searchParams.get("minHoursPerVisit") || "")
    const [maxHoursPerVisit, setMaxHoursPerVisit] = useState(searchParams.get("maxHoursPerVisit") || "")
    const [visitType, setVisitType] = useState<string>(searchParams.get("visitTypes") || "all")

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString())

        // Reset page on filter change
        params.set("page", "1")

        if (startDate) params.set("startDate", startDate.toISOString())
        else params.delete("startDate")

        if (endDate) params.set("endDate", endDate.toISOString())
        else params.delete("endDate")

        if (hasProducts !== undefined) params.set("hasProducts", String(hasProducts))
        else params.delete("hasProducts")

        if (minPrice) params.set("minPrice", minPrice)
        else params.delete("minPrice")
        if (maxPrice) params.set("maxPrice", maxPrice)
        else params.delete("maxPrice")

        if (minProfit) params.set("minProfit", minProfit)
        else params.delete("minProfit")
        if (maxProfit) params.set("maxProfit", maxProfit)
        else params.delete("maxProfit")

        if (minNominalHour) params.set("minNominalHour", minNominalHour)
        else params.delete("minNominalHour")
        if (maxNominalHour) params.set("maxNominalHour", maxNominalHour)
        else params.delete("maxNominalHour")

        if (minVisits) params.set("minVisits", minVisits)
        else params.delete("minVisits")
        if (maxVisits) params.set("maxVisits", maxVisits)
        else params.delete("maxVisits")

        if (minHoursPerVisit) params.set("minHoursPerVisit", minHoursPerVisit)
        else params.delete("minHoursPerVisit")
        if (maxHoursPerVisit) params.set("maxHoursPerVisit", maxHoursPerVisit)
        else params.delete("maxHoursPerVisit")

        if (visitType && visitType !== "all") params.set("visitTypes", visitType)
        else params.delete("visitTypes")

        router.push(`?${params.toString()}`)
    }

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
        setHasProducts(undefined)
        setMinPrice("")
        setMaxPrice("")
        setMinProfit("")
        setMaxProfit("")
        setMinNominalHour("")
        setMaxNominalHour("")
        setMinVisits("")
        setMaxVisits("")
        setMinHoursPerVisit("")
        setMaxHoursPerVisit("")
        setVisitType("all")

        const params = new URLSearchParams()
        if (searchParams.get("query")) params.set("query", searchParams.get("query")!)

        router.push(`?${params.toString()}`)
    }

    return {
        startDate, setStartDate,
        endDate, setEndDate,
        hasProducts, setHasProducts,
        minPrice, setMinPrice,
        maxPrice, setMaxPrice,
        minProfit, setMinProfit,
        maxProfit, setMaxProfit,
        minNominalHour, setMinNominalHour,
        maxNominalHour, setMaxNominalHour,
        minVisits, setMinVisits,
        maxVisits, setMaxVisits,
        minHoursPerVisit, setMinHoursPerVisit,
        maxHoursPerVisit, setMaxHoursPerVisit,
        visitType, setVisitType,
        applyFilters,
        clearFilters
    }
}

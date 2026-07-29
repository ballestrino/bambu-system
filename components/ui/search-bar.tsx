"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "./button";
import { Clock3, Loader2, Search } from "lucide-react";
import { useRecentSearches } from "./use-recent-searches";

type SearchBarProps = {
    placeholder?: string;
    recentSearchesStorageKey?: string;
};

export function SearchBar({
    placeholder = "Search...",
    recentSearchesStorageKey,
}: SearchBarProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [showRecentSearches, setShowRecentSearches] = useState(false);
    const { recentSearches, saveSearch } = useRecentSearches(recentSearchesStorageKey);

    const handleSearch = (term: string) => {
        const normalizedTerm = term.trim();
        setShowRecentSearches(false);
        saveSearch(normalizedTerm);

        const currentQuery = searchParams.get("query")?.toString() || "";
        if (currentQuery === normalizedTerm) return;

        setLoading(true);
        const params = new URLSearchParams(searchParams);
        if (normalizedTerm) {
            params.set("query", normalizedTerm);
        } else {
            params.delete("query");
        }
        replace(`${pathname}?${params.toString()}`);
        setTimeout(() => setLoading(false), 500);
    };

    const currentQuery = searchParams.get("query")?.toString() || "";

    return (
        <div
            className="relative flex flex-1 gap-2 shrink-0"
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setShowRecentSearches(false);
                }
            }}
        >
            <Input
                key={currentQuery}
                ref={searchInputRef}
                className="w-full max-w-xs bg-background"
                placeholder={placeholder}
                defaultValue={currentQuery}
                onFocus={() => setShowRecentSearches(true)}
                onChange={(e) => {
                    const value = e.target.value
                    if (value === "") {
                        handleSearch("")
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleSearch(e.currentTarget.value)
                    }
                }}
            />
            {showRecentSearches && recentSearches.length > 0 && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full max-w-xs rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Búsquedas recientes
                    </p>
                    {recentSearches.map((search) => (
                        <button
                            key={search.toLocaleLowerCase()}
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSearch(search)}
                        >
                            <Clock3 className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{search}</span>
                        </button>
                    ))}
                </div>
            )}
            <Button
                variant={'outline'}
                className="cursor-pointer"
                onClick={() => handleSearch(searchInputRef.current?.value || "")}
                disabled={loading}
            >
                <span className="hidden md:inline">Buscar</span>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search />}
            </Button>
        </div>
    );
}

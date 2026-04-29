"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "./button";
import { Loader2, Search } from "lucide-react";

export function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = (term: string) => {
        const currentQuery = searchParams.get("query")?.toString() || "";
        if (currentQuery === term) return

        setLoading(true);
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        replace(`${pathname}?${params.toString()}`);
        setTimeout(() => setLoading(false), 500);
    };

    const currentQuery = searchParams.get("query")?.toString() || "";

    return (
        <div className="relative flex flex-1 gap-2 shrink-0">
            <Input
                key={currentQuery}
                ref={searchInputRef}
                className="w-full max-w-xs bg-background"
                placeholder={placeholder}
                defaultValue={currentQuery}
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

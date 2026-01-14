"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { Loader2, Search } from "lucide-react";

export function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace, push } = useRouter();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("query")?.toString() || "");
    const [loading, setLoading] = useState(false);

    const handleSearch = (term: string) => {
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

    const clearSearch = () => {
        push(pathname)
    }

    useEffect(() => {
        if (searchTerm.trim() === "") {
            clearSearch()
        }


    }, [searchTerm])

    return (
        <div className="relative flex flex-1 gap-2 shrink-0">
            <Input
                className="w-full max-w-xs bg-background"
                placeholder={placeholder}
                defaultValue={searchParams.get("query")?.toString()}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
            />
            <Button variant={'outline'} className="cursor-pointer" onClick={() => handleSearch(searchTerm)} disabled={loading}>Search
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search />}
            </Button>
        </div>
    );
}

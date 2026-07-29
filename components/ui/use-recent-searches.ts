"use client";

import { useState } from "react";

const MAX_RECENT_SEARCHES = 5;

const readRecentSearches = (storageKey: string) => {
    if (typeof window === "undefined") return [];

    try {
        const storedValue: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        return Array.isArray(storedValue)
            ? storedValue.filter((value): value is string => typeof value === "string")
            : [];
    } catch {
        return [];
    }
};

export function useRecentSearches(storageKey?: string) {
    const [recentSearches, setRecentSearches] = useState<string[]>(() =>
        storageKey ? readRecentSearches(storageKey).slice(0, MAX_RECENT_SEARCHES) : []
    );

    const saveSearch = (search: string) => {
        const normalizedSearch = search.trim();
        if (!storageKey || !normalizedSearch) return;

        setRecentSearches((currentSearches) => {
            const nextSearches = [
                normalizedSearch,
                ...currentSearches.filter(
                    (item) => item.toLocaleLowerCase() !== normalizedSearch.toLocaleLowerCase()
                ),
            ].slice(0, MAX_RECENT_SEARCHES);

            try {
                localStorage.setItem(storageKey, JSON.stringify(nextSearches));
            } catch {
                // Search still works when storage is unavailable.
            }

            return nextSearches;
        });
    };

    return { recentSearches, saveSearch };
}

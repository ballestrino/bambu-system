"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"


export function ReactQueryProvider({
    children,
}: {
    children: React.ReactNode,
}) {
    // Create QueryClient inside the component to avoid sharing state between requests
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                        refetchOnMount: false
                    }
                }
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools buttonPosition="bottom-left" />
        </QueryClientProvider>
    )
}

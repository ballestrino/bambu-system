"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/budgets/app-sidebar";

export default function layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                <div className="h-full pt-10 w-full flex items-center justify-center flex-col gap-4 relative">
                    <div className="flex container w-full items-center gap-2">
                        <SidebarTrigger />
                        <Button onClick={() => router.back()} variant="ghost" className="w-fit">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </div>
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

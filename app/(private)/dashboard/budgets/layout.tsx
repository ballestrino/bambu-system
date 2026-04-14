
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/budgets/app-sidebar";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="fixed top-[90px] z-10 left-0">
                <SidebarTrigger />
            </div>

            <main className="w-full">
                <div className="h-full pt-10 w-full flex items-center justify-center flex-col gap-4 relative">
                    <div className="flex container w-full items-center px-4 gap-2">
                        <Button asChild variant="outline" size="sm" className="w-fit">
                            <Link href="/dashboard/budgets">
                                <ChevronLeft className="h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                    </div>
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

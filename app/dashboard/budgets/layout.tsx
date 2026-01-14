"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    return (
        <div className="min-h-screen w-full flex items-center justify-center flex-col gap-4 relative">
            <div className="flex container w-full">
                <Button onClick={() => router.back()} variant="ghost" className="w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </div>
            {children}
        </div>
    )
}

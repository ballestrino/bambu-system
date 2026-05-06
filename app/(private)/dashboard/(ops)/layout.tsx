import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { OpsSidebar } from "@/components/ops/sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <OpsSidebar />
      <div className="fixed top-[90px] left-0 z-10">
        <SidebarTrigger />
      </div>

      <main className="w-full">
        <div className="relative flex h-full w-full flex-col items-center gap-4 px-4 pt-10 pb-10">
          <div className="container flex w-full items-center gap-2">
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/dashboard/jobs">
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
          </div>
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}

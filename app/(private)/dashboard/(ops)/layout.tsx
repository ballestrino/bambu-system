import { OpsSidebar } from "@/components/ops/sidebar";
import { opsSurface } from "@/components/ops/shared/ops-theme";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <OpsSidebar />
      <div className="fixed left-3 top-24 z-30 md:left-4">
        <SidebarTrigger className="border border-[#53985E]/20 bg-background/90 text-[#244C2D] shadow-sm hover:bg-[#EAF5EC] dark:text-[#A7D8AE]" />
      </div>

      <main className="w-full min-w-0">
        <div
          className={cn(
            "relative flex min-h-[calc(100vh-5rem)] w-full flex-col items-center px-4 py-6 md:px-6 md:py-8",
            opsSurface.shell
          )}
        >
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}

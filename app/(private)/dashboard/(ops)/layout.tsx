import { OpsSidebar, OpsSidebarFloatingTrigger } from "@/components/ops/sidebar";
import { opsSurface } from "@/components/ops/shared/ops-theme";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <OpsSidebar />
      <OpsSidebarFloatingTrigger />

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

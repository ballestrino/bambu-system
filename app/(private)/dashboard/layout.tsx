import {
  DashboardSidebar,
  DashboardSidebarFloatingTrigger,
} from "@/components/dashboard/dashboard-sidebar";
import { opsSurface } from "@/components/ops/shared/ops-theme";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <DashboardSidebarFloatingTrigger />

      <main className="w-full min-w-0">
        <div
          className={cn(
            "relative flex min-h-[calc(100vh-5rem)] w-full flex-col items-center px-4 pb-6 pt-12 md:px-6 md:py-8",
            opsSurface.shell
          )}
        >
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}


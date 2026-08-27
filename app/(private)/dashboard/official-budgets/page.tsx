"use client";

import Link from "next/link";
import { Archive, BadgeCheck, RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useOfficialBudgets } from "@/components/official-budgets/hooks/use-official-budgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { Skeleton } from "@/components/ui/skeleton";

const date = (value: string) =>
  new Intl.DateTimeFormat("es-UY", { dateStyle: "medium" }).format(new Date(value));

function OfficialBudgetsContent() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const status = params.get("status") === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
  const query = params.get("query")?.trim() || undefined;
  const result = useOfficialBudgets({ status, query });

  const selectStatus = (next: "ACTIVE" | "ARCHIVED") => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("status", next);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  return (
    <div className="container flex h-full flex-col gap-6 px-4 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Presupuestos oficiales</h1>
        <p className="text-muted-foreground">Precios comerciales publicados, versionados y auditables.</p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchBar placeholder="Buscar presupuesto oficial..." recentSearchesStorageKey="bambu:official-budget-searches" />
        <div className="flex gap-2">
          <Button variant={status === "ACTIVE" ? "default" : "outline"} onClick={() => selectStatus("ACTIVE")}>Activos</Button>
          <Button variant={status === "ARCHIVED" ? "default" : "outline"} onClick={() => selectStatus("ARCHIVED")}>Archivados</Button>
          <Button variant="outline" size="icon" onClick={() => result.refetch()} disabled={result.isFetching} title="Reintentar o refrescar">
            <RefreshCw className={result.isFetching ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {result.isLoading && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-44" />)}</div>}
      {result.isError && <Card className="border-destructive/40"><CardContent className="flex items-center justify-between p-6"><p>No pudimos cargar los presupuestos oficiales.</p><Button variant="outline" onClick={() => result.refetch()}>Reintentar</Button></CardContent></Card>}
      {!result.isLoading && !result.isError && result.data?.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{query ? "No hay resultados para esta búsqueda." : status === "ACTIVE" ? "Todavía no hay presupuestos oficiales activos. Publícalos desde el generador." : "No hay presupuestos oficiales archivados."}</CardContent></Card>
      )}
      {result.data && result.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.data.map((budget) => (
            <Link key={budget.id} href={`/dashboard/official-budgets/${budget.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg">{budget.sourceBudgetName}</CardTitle><Badge variant={budget.status === "ACTIVE" ? "default" : "secondary"}>{budget.status === "ACTIVE" ? <BadgeCheck /> : <Archive />}{budget.status === "ACTIVE" ? "Activo" : "Archivado"}</Badge></div></CardHeader>
                <CardContent className="space-y-2 text-sm"><p><span className="text-muted-foreground">Versión actual:</span> v{budget.currentVersion}</p><p><span className="text-muted-foreground">Publicado:</span> {date(budget.publishedAt)}</p><p><span className="text-muted-foreground">Generador:</span> {budget.sourceBudget ? budget.sourceBudget.name : "Desvinculado"}</p></CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OfficialBudgetsPage() {
  return <Suspense fallback={<Skeleton className="h-64 w-full" />}><OfficialBudgetsContent /></Suspense>;
}

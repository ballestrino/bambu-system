"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, RefreshCw } from "lucide-react";
import { use, useState } from "react";

import { ArchiveOfficialBudgetButton } from "@/components/official-budgets/official-budget-controls";
import { OfficialOptionBreakdown } from "@/components/official-budgets/official-option-breakdown";
import { useOfficialBudget } from "@/components/official-budgets/hooks/use-official-budgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const date = (value: string) => new Intl.DateTimeFormat("es-UY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function OfficialBudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const result = useOfficialBudget(id);
  const [selectedVersion, setSelectedVersion] = useState<number>();

  if (result.isLoading) return <div className="container space-y-4 px-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>;
  if (result.isError) return <Card><CardContent className="flex items-center justify-between p-6"><p>No pudimos cargar el presupuesto oficial.</p><Button variant="outline" onClick={() => result.refetch()}><RefreshCw /> Reintentar</Button></CardContent></Card>;
  if (!result.data) return <Card><CardContent className="p-8 text-center">Presupuesto oficial no encontrado.</CardContent></Card>;

  const budget = result.data;
  const version = budget.versions.find((item) => item.version === selectedVersion) ?? budget.versions[0];

  return (
    <div className="container flex flex-col gap-6 px-4 pb-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="space-y-2"><Button asChild variant="ghost" size="sm"><Link href="/dashboard/official-budgets"><ArrowLeft /> Volver</Link></Button><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">{budget.sourceBudgetName}</h1><Badge variant={budget.status === "ACTIVE" ? "default" : "secondary"}><BadgeCheck /> {budget.status === "ACTIVE" ? "Activo" : "Archivado"}</Badge></div><p className="text-sm text-muted-foreground">Publicado {date(budget.publishedAt)} · versión actual {budget.currentVersion}</p></div>
        <div className="flex flex-wrap gap-2">{budget.sourceBudget && <Button asChild variant="outline"><Link href={`/dashboard/budgets/budget/${budget.sourceBudget.slug}`}>Abrir generador</Link></Button>}{budget.status === "ACTIVE" && <ArchiveOfficialBudgetButton id={budget.id} />}</div>
      </div>

      <div className="flex flex-wrap gap-2">{budget.versions.map((item) => <Button key={item.id} size="sm" variant={item.version === version.version ? "default" : "outline"} onClick={() => setSelectedVersion(item.version)}>Versión {item.version}</Button>)}</div>
      <Card><CardContent className="grid gap-3 p-5 text-sm md:grid-cols-3"><div><p className="text-muted-foreground">Servicio</p><p className="font-semibold">{version.serviceName}</p></div><div><p className="text-muted-foreground">Versión publicada</p><p className="font-semibold">{date(version.publishedAt)}</p></div><div><p className="text-muted-foreground">Publicó</p><p className="font-semibold">{version.publishedBy.name || version.publishedBy.email || "Administrador"}</p></div>{version.serviceDescription && <div className="md:col-span-3"><p className="text-muted-foreground">Descripción</p><p>{version.serviceDescription}</p></div>}</CardContent></Card>
      <div className="space-y-4">{version.options.map((option) => <OfficialOptionBreakdown key={option.id} option={option} currency={version.currency} />)}</div>
    </div>
  );
}

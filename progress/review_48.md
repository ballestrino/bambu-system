# Review - billing_list_filters (feature 48)

**Verdict:** APPROVED

Alcance: el cambio sobre `a36df32` en `claude/elegant-edison-wmcobi`.
Revisado contra `docs/billing.md` y los criterios de `feature_list.json`
(la descripción se ajustó al diseño que pidió el usuario: panel plegable y
la hoja de Visitas en vez de chips).

## Criterios

1. Cada vista muestra su cuenta y los filtros se combinan con la búsqueda:
   verificado en Chromium (Aceptada + "2145" → Emitidas 1) y en
   `billing-filter-checks`.
2. Lo archivado solo aparece en Archivadas: `data/billing/month.ts` lo saca
   de `issued` y del borrador; la página pasa `list.archived` solo a esa
   vista (check de fuente); archivar desde Emitidas la mueve en vivo.
3. "Emitir N" cuenta todas las marcadas: la barra recibe el borrador entero;
   con "Desmarcadas" la barra sigue en 2 marcadas · $ 29.280 y el borrador
   avisa cuántas oculta el filtro.
4. tsc, lint, check:billing y smoke a 1440 y 390 px: PASS, más `pnpm build`
   e `init.sh`.

## Revisado sin hallazgos

- El filtro de marcadas solo existe y se aplica en el borrador; en
  Emitidas/Archivadas no cuenta como filtro puesto.
- La búsqueda por RUT exige 3 dígitos o más y un término sin letras, así un
  nombre con números no da falsos positivos por documento.
- Filtrar en el cliente no cambia lo que se lee ni lo que se emite; el
  sondeo de DGI sigue mirando todo el mes.
- Archivos bajo 200 líneas; `VisitSheet` se reusa sin tocarla.

## Notas no bloqueantes

- `VisitSheet` vive en `components/ops/visits/`; si otra página la usa,
  conviene moverla a `components/ops/shared/`.
- Los filtros no van en la URL: se pierden al recargar (como pidió el plan:
  "siguen al cambiar de mes", no entre visitas).

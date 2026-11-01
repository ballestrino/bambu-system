# Review - billing_delete_archive (feature 47)

**Verdict:** APPROVED

Alcance: `f621317..HEAD` en `claude/elegant-edison-wmcobi` (el WIP `92a862c`
más el cierre). Revisado contra el plan de `docs/billing.md` y los criterios
de `feature_list.json`.

## Criterios

1. Borrar una fila marcada la saca del borrador, de la cuenta y del total, y
   un "Emitir" abierto antes se rechaza y recarga: verificado en Chromium con
   dos pestañas y por script (`claimBatchIssue` → `stale`).
2. Una emitida ofrece Archivar y nunca Borrar, también por la acción: la UI
   no lo ofrece (Emitidas no tiene "Borrar"; las filas bloqueadas del
   borrador tampoco) y el store devuelve `issued`/`issuing` sin borrar ni
   auditar para `ISSUED`, `ACCEPTED`, `REJECTED`, `ISSUING` y `UNKNOWN`.
3. Una archivada sigue archivada al sincronizar y cuenta en el resumen: la
   sync no menciona `archivedAt` (check de fuente), el smoke la re-sincroniza
   con el store real y el resumen la cuenta; en la página el total y
   "1 rechazada" no cambian al archivar.
4. Migración aditiva aplicada en Neon antes del push: aplicada en la rama
   `feature-39-billing` (en local, según `progress/current.md`); desde cloud
   no se llega a Neon. Se pushea solo a la rama de la feature; producción
   antes del merge.
5. tsc, lint, check:billing y smoke en escritorio y 390 px: PASS.

## Revisado sin hallazgos

- Concurrencia del borrado: locks del mes y del lote antes de releer, CAS
  sobre `updatedAt` en el `deleteMany` y lote tocado en la misma transacción.
  Un "Repetir" posterior no vuelve a crear la fila borrada mientras el lote
  tenga otras repetidas (`createRepeatDraft` solo completa un lote sin
  repetidas).
- Archivar: `updateMany` condicionado al estado y a `archivedAt`, idempotente
  y sin auditoría doble. `archivedById` con `SetNull`.
- La acción exige admin (`requireAdminSession`, check de fuente) y devuelve
  `{ error }` en vez de tirar (evita el React #441 de producción).
- El sondeo de DGI sigue mirando lo archivado pendiente.

## Notas no bloqueantes

- Si se borran todas las filas, en el teléfono queda la tarjeta de la lista
  vacía (un borde sin contenido) y en escritorio "Para emitir · 0". Se
  recupera con "Repetir <mes>". La 48 rehace esta zona.
- En el teléfono, Archivar es solo un ícono (con `aria-label` y `title`).

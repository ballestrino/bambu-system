# Feature 12 - `payroll_data_gaps`

Rama `feature/12-payroll-data-gaps`, desde `main` en `2a464de`. Código en
`2208b2c`.

## Diagnóstico (solo lectura, 2026-09-28)

- Antes de agosto, las visitas no tenían empleada asignada (mayo 0 de 126,
  julio 1 de 142) y en junio y julio casi ninguna tenía hora real. Por eso los
  meses de pago que las saldan daban negativo: junio −26.946 y agosto
  −99.524.
- Los pagos del 6 al 10/8 y los $ 772 del 24/8 pagaron julio, pero estaban
  cargados con período de agosto. Los $ 772 son exactamente lo que se le
  sugería a Fabián por la visita del 27/7. Los $ 504 del 28/8 ("SERVICIO
  LAZARINA ADELANTO") son un adelanto a cuenta de agosto.
- No había pagos asignados a septiembre.
- Según el usuario, los sueldos se empezaron a registrar en agosto; julio no
  tiene las horas bien cargadas.

## Decisión del usuario

La recomendación que aprobó: registrar los sueldos desde las horas de agosto
de 2026, dejar lo anterior como historial fuera de los saldos, y no anular
pagos, porque son costos reales de Finanzas.

## Código

- `lib/ops/finance/payroll-period.ts`: `PAYROLL_TRACKING_START_MONTH_KEY =
  "2026-08"`, `PAYROLL_TRACKING_START_LABEL` e `isPayrollWorkMonthTracked`.
- `getPayrollPeriod` suma `isTracked`. Cuando el mes no tiene registro,
  `getPayrollPeriodDescription` lo avisa y `applyPayrollTracking` deja en null
  el sugerido y el saldo de cada fila.
- `PayrollSummary` muestra "Sin registro" en Sugerido y Saldo. Lo usan
  `/dashboard/payroll`, Finanzas → Pagos y el panel de la empleada.
- Agente: `getPayrollSummary` devuelve `tracked` y `trackingStartLabel`, con
  el sugerido y el saldo en null. La tarjeta muestra "Sin registro"; las
  conversaciones guardadas antes, sin `tracked`, se ven como antes.
- `scripts/fix-payroll-data-gaps.ts`: vista previa por defecto. `--apply
  --actor=<email ADMIN>` escribe en una transacción interactiva que se
  revierte si alguna cantidad difiere de lo revisado.

## Escritura en producción

Aprobada por el usuario después de ver la vista previa. Se corrió
`--apply --actor=nachoballestrino02@gmail.com` y dio:

- 259 visitas archivadas (DONE, antes del 1/8, sin hora real, ninguna con
  empleada ni horas): 2 de mayo, 116 de junio y 141 de julio;
- 7 pagos con período cambiado a 2026-07-01→2026-07-31, por $ 99.792;
- 1 adelanto ($ 504) movido a mes de pago septiembre, con período de agosto.

| | Antes | Después |
| --- | --- | --- |
| Visitas mayo / junio / julio sin archivar | 126 / 128 / 142 | 124 / 12 / 1 |
| Visitas agosto / septiembre | 285 / 341 | sin cambios |
| Pagos (total) | 15 | 15 |
| Mes de pago junio (trabajo de mayo) | −26.946 | Sin registro |
| Mes de pago agosto (trabajo de julio) | −99.524 | Sin registro (pagado $ 99.792) |
| Mes de pago septiembre (trabajo de agosto) | 120.858 − 0 | 120.858 − 504 = 120.354 |
| Mes de pago octubre (septiembre, parcial) | 85.764 | 85.764 |

- En Finanzas, los $ 504 pasan de costo de agosto a costo de septiembre. El
  resto de los costos no cambia.
- El saldo de septiembre se va a ajustar cuando se carguen los sueldos de
  agosto pagados en septiembre. Eso lo hace el usuario.

## Verificación

- PASS: `tsc`, `pnpm lint`, los 27 `check:*` (`check:finance` cubre el corte:
  julio sin registro, agosto y siguientes con registro, y filas en null) y
  `next build` sin avisos.
- `pnpm build` falló en `prisma generate` con EPERM: el `next dev` del 3001
  (PID 12564, que no se levantó en esta sesión) tenía tomado el DLL del motor.
  El cliente 6.19.3 ya estaba generado y el schema no cambió, así que se
  corrió `next build` solo. Se borró el `.tmp` del intento.
- Smoke con sesión en el Chrome del usuario, antes de escribir: Pagos en
  agosto muestra "Sin registro" y "-" por empleada, con pagado $ 100.296
  (todavía con el adelanto); septiembre, sugerido $ 120.858. Sin errores en
  la consola.
- Recálculo de solo lectura después de escribir: la tabla de arriba.

## Fuera de alcance

- El "Resumen del período" de la empleada trabaja por rango de fechas. Con
  los períodos corregidos, agosto queda bien; un rango de julio muestra los
  pagos de julio sin horas.
- Las visitas de mayo con hora (124) y las 12 de junio con hora siguen como
  historial. No tienen empleada, así que no entran en ningún sueldo.

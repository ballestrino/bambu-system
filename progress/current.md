# Current Harness Session

Status: in_progress

## Active Feature

- 12 `payroll_data_gaps`, en la rama `feature/12-payroll-data-gaps`. El
  usuario aprobó la recomendación ("dale, hacelo").
- Código en `2208b2c`: corte `PAYROLL_TRACKING_START_MONTH_KEY = "2026-08"`
  en `lib/ops/finance/payroll-period.ts`. Pagos, Finanzas → Pagos, el panel
  de la empleada y el agente muestran "Sin registro" en sugerido y saldo para
  los meses de pago anteriores a septiembre.
  - PASS: `tsc`, lint y los 27 `check:*` (`check:finance` cubre el corte).
  - Smoke en el Chrome del usuario, en el `next dev` del 3001 (ya estaba
    corriendo, no se tocó): agosto muestra "Sin registro" con pagado
    $ 100.296; septiembre, sugerido $ 120.858. Sin errores en consola.
- `scripts/fix-payroll-data-gaps.ts`: vista previa con 259 visitas (0 con
  empleada u horas), 7 pagos por $ 99.792 y el adelanto de $ 504.
- 2026-09-28: el usuario aprobó y se aplicó en producción
  (`--actor=nachoballestrino02@gmail.com`). El recálculo de solo lectura dio
  lo esperado: septiembre 120.858 − 504 = 120.354, y agosto y septiembre
  quedaron sin cambios. `next build` pasa. La verificación está en verde y
  falta el OK del usuario para cerrarla y mergearla. Detalle en
  `progress/impl_payroll_data_gaps.md`.
- Fuera del corte: el "Resumen del período" de la empleada trabaja por rango
  de fechas. Con los períodos corregidos, agosto queda bien; un rango de
  julio mostraría los pagos de julio sin horas.
- Usuario (2026-09-28): julio no tiene las horas bien registradas y lo
  borraría; agosto y septiembre son los meses bien registrados, porque ahí
  empezaron a registrar.
- Reporte de solo lectura contra producción (2026-09-28):
  - Visitas por mes (sin archivar / archivadas): mayo 126 DONE (124 con
    hora); junio 128 DONE (116 sin hora); julio 142 DONE (141 sin hora; la
    única con hora es del 27/7); agosto 184 DONE con hora; septiembre 132
    DONE con hora y 99 programadas. No hay `TimeEntry` en ningún mes.
  - Pagos: 15 en total. Agosto tiene 8 registrados por $ 100.296 y 1 anulado,
    todos con período 1–31 de agosto. Los del 6 al 10/8 (Monica, Andrea,
    Rosa, Ana Leticia, Mariana y Fabián, este con la nota "34 horas
    trabajo") pagan julio. Fabián tiene además dos pagos al final de agosto:
    $ 772 el 24/8 y $ 504 el 28/8 ("ADELANTO"). No hay ningún pago asignado
    a septiembre ni a octubre.
  - Saldos por mes de pago: agosto (trabajo de julio): sugerido $ 772 −
    pagado $ 100.296 = −99.524. Septiembre (agosto): sugerido $ 120.858 y
    pagado $ 0. Octubre (septiembre, parcial): sugerido $ 85.764.
  - El "Eliminar" de visitas de la app archiva (`archivedAt`), y el
    archivado ya se excluye de sueldos, rentabilidad y el agente.
  - Los pagos `RECORDED` son costos del mes en Finanzas. Anularlos para que el
    saldo dé cero sacaría $ 100.296 de costos reales de agosto.
  - Antes de agosto, las visitas no tienen empleada asignada: mayo 0 de 126 y
    julio 1 de 142. Por eso el mes de pago junio también da negativo
    (−26.946), igual que agosto.
  - Los $ 772 del 24/8 son exactamente lo que se le sugería a Fabián por julio
    (la visita del 27/7: 4 h más viático). El pago de $ 504 del 28/8
    ("SERVICIO LAZARINA ADELANTO") es un adelanto.
  - Finanzas cuenta los pagos por `assignedMonth`.
- Recomendación aprobada:
  - Código: los sueldos se registran desde el trabajo de agosto de 2026. Para
    los meses de pago anteriores a septiembre, las pantallas de sueldos y el
    agente muestran "Sin registro" en lugar de un saldo.
  - Datos:
    - archivar las visitas DONE sin hora real anteriores al 1/8 (259);
    - corregir a 1–31 de julio el período de los 7 pagos de agosto que
      pagan julio;
    - pasar el adelanto de $ 504 a mes de pago septiembre, con período de
      agosto.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.
- Activa: 12 `payroll_data_gaps`.
- Las 12 y 13 escriben en la base de producción (`.env`): primero una
  consulta de solo lectura, después el permiso explícito del usuario.
- Para la 15: resend ya está en 6.30.0 desde la 11.

## Last Closed Work

- 2026-09-28: parche de dependencias con avisos altos (11), en `main` sin
  push. En producción queda sin probar el sync IMAP real, que ejercita el
  cron después del deploy.
- 2026-09-24: limpieza y renumeración del feature_list.
- `origin/main` estaba en `4a63e22` (la limpieza del feature_list) antes de
  mergear la 11.
- Fuera de alcance, ya estaba en `main`: error de hidratación del botón
  "Nuevo correo" en `/dashboard/email`.

## Decisiones pendientes del usuario

- Qué hacer con los precios con centavos de los presupuestos guardados antes
  de las reglas de precio del agente.
- Si "Abrir en página" se ofrece también desde el Sheet de crear del agente.
- Un `replaceState` durante una navegación pendiente en la página del agente,
  a confirmar.
- Qué período usa la rentabilidad de Trabajos cuando el control de mes deje de
  ser global (se decide en la 18).

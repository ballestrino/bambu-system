# Visitas

Página `/dashboard/calendar` (feature 26, diseño de claude-design
"Visitas Bambu 3a-2a"). En el código una visita es un `JobOccurrence`.

## Vistas

| Vista | Escritorio (3a) | Celular (2a) |
| --- | --- | --- |
| Agenda | Tira de 7 días con cuentas y punto de atención, "Mes" en popover, lista del día agrupada por hora y panel fijo con el detalle, el registro y la asignación | Tarjetas por empleada ("Sin asignar" primero), botón "+" flotante |
| Día por empleada | Mini mes, "Requiere atención", grilla 07–20 con una columna por empleada, línea de "ahora" y detalle superpuesto; registrar abre un modal | No se ofrece: muestra la Agenda |
| Cronograma | `components/ops/schedules/`: filas por empleada con pin, horas, carga (sobre 30 h) y cruces; arrastrar, Generar semana, Buscar huecos, Disponibilidad, filtro L–D, Exportar (PDF del equipo y por empleada) y "Comparar fijadas" (hasta 2 pines) | Días fijos a la izquierda y una columna de 173 px por empleada elegida en "Empleadas en el cronograma" |

La vista se guarda en `bambu:ops:visits:view`. Los valores de antes del
rediseño se traducen: `calendar`, `list` y `cards` pasan a Agenda, y
`schedule` pasa a Cronograma. Lista y Tarjetas se quitaron por decisión del
usuario (2026-10-09). El historial de una empleada sigue en Empleados ›
Visitas.

## Escritorio o celular

Se decide por el ancho del panel, no de la ventana, porque la barra lateral
lo angosta. Desde 896 px (`@4xl/visits`) va el diseño de escritorio. Hasta
medir el panel se dibujan los dos diseños y el container query muestra uno.
Después solo se monta el que corresponde, así las hojas del celular y los
modales del escritorio no se abren de más (`visits-page.tsx`).

## Fechas y datos

- El selector de mes global (`OpsSelectedMonthProvider`) sigue visible por
  decisión del usuario. La tira, el mini mes y las flechas de día navegan
  dentro de ese mes; al cruzar a otro mes lo cambian con `setMonth`.
- La consulta es la del mes estirada a semanas completas
  (`use-visits-data.ts`). Así la tira y el cronograma del celular cuentan los
  días del mes vecino.
- Días, horas y posiciones se calculan en America/Montevideo
  (`lib/ops/visit-day.ts`, `lib/ops/visit-calendar.ts`).
- "Requiere atención" se cumple si la visita no tiene equipo o si está
  omitida o cancelada (`isAttentionVisit`). La regla es la misma que usa el
  filtro del servidor.
- Disponibilidad para asignar (`lib/ops/visit-availability.ts`): una empleada
  está ocupada si tiene otra visita programada o realizada que se cruza ese
  día. Si tiene reglas de disponibilidad cargadas, también está ocupada fuera
  de ellas.
- Registrar y asignar son `updateJobOccurrence` parciales
  (`use-visit-actions.ts`). Para registrar se envían el estado, el horario
  real (solo si la visita fue realizada) y las notas. Para asignar se envía
  `employeeIds: [id]`. Crear y editar siguen en `JobOccurrenceDialog`.
- El agente también agenda lotes de visitas sueltas de un trabajo (hasta 20,
  con `createJobOccurrences`, todas o ninguna; en la tarjeta se desmarcan
  las que no van), cambia varias con el mismo cambio en una tarjeta
  (`updateJobOccurrences`, todas o ninguna) y cambia y elimina visitas
  con propuestas que se confirman en el chat (`docs/agent.md`, "Propuestas
  de visitas"), con las mismas acciones.

## Checks

`pnpm check:visit-day` (lógica pura) y `pnpm check:visits-view` (vistas,
estados y armado de la página). El Cronograma conserva `check:schedule*`.

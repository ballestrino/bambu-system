# Visitas

Página `/dashboard/calendar` (feature 26, diseño de claude-design
"Visitas Bambu 3a-2a"). En el código una visita es un `JobOccurrence`.

## Vistas

| Vista | Escritorio (3a) | Celular (2a) |
| --- | --- | --- |
| Agenda | Tira de 7 días con cuentas y punto de atención, "Mes" en popover, lista del día agrupada por hora y panel fijo con el detalle, el registro y la asignación | Tarjetas por empleada ("Sin asignar" primero), botón "+" flotante |
| Día por empleada | Mini mes, "Requiere atención", grilla 07–20 con una columna por empleada, línea de "ahora" y detalle superpuesto; registrar abre un modal | No se ofrece: muestra la Agenda |
| Cronograma | `components/ops/schedules/`: filas por empleada con pin, horas, carga (sobre 30 h) y cruces; arrastrar, Generar semana, Buscar huecos, Disponibilidad, filtro L–D, Exportar (PDF del equipo y por empleada) y "Comparar fijadas" (hasta 2 pines) | Días fijos a la izquierda y una columna de 173 px por empleada elegida en "Empleadas en el cronograma" |
| Pendientes | `components/ops/visits/pending/` (feature 70): las pendientes de registro de todas las fechas, con la cuenta en el selector de vista. Tarjetas "para empezar" (sin equipo, más de 30 días, los trabajos que más acumulan), antigüedad, búsqueda y equipo, lista agrupada por trabajo con casillas y barra de lote | La misma vista, apilada; sin tira de días ni filtros de la Agenda |

La vista se guarda en `bambu:ops:visits:view`. Los valores de antes del
rediseño se traducen: `calendar`, `list` y `cards` pasan a Agenda, y
`schedule` pasa a Cronograma. Lista y Tarjetas se quitaron por decisión del
usuario (2026-10-09). El historial de una empleada sigue en Empleados ›
Visitas.

Links desde Inicio (`use-visits-deep-link.ts`): `?vista=` abre una vista
(`pendientes`, `agenda`, `cron`, `dia`), `?dia=YYYY-MM-DD` un día y
`?visita=<id>` su detalle. Se leen una vez al montar y se sacan de la URL; la
vista también se escribe en `bambu:ops:visits:view` para que la lectura de la
vista guardada no la pise.

## Pendientes de registro

- Pendiente = programada, de hoy o de antes (día de Montevideo) y sin
  horario real completo (`lib/ops/pending-visits.ts`). La consulta es la de
  Inicio: programadas hasta mañana, sin visitas de trabajos archivados
  (`usePendingVisits`).
- Antigüedad: hoy, 1 a 7 días, 8 a 30 y más de 30. Grupos y filtros en
  `lib/ops/pending-visit-groups.ts`.
- Cada trabajo abierto tiene "Elegir por día": un chip por día de la semana
  con su cuenta que elige o suelta todas esas visitas (por ejemplo todos los
  miércoles de Godoy, para borrar una generación mala). Cuenta también las
  que quedan debajo de "Mostrar" (`getPendingWeekdays`).
- "Contraer todo" / "Expandir todo" en la cabecera de la lista abre o cierra
  todos los trabajos, también los que están debajo de "Ver los restantes".
- De a una: Registrar (con equipo) o Asignar abren `JobOccurrenceDialog`; el
  menú marca omitida, cancela o elimina (eliminar pide confirmación).
- En lote (`resolvePendingVisits`, hasta 500, todas o ninguna): asignar una
  empleada (reemplaza el equipo), registrar como hechas con el horario
  programado como real (solo si todas tienen equipo; suman al pago),
  omitirlas o cancelarlas (sin horario real) o eliminarlas: se archivan, como
  "Eliminar visita", y el cronograma no las vuelve a generar porque una
  visita archivada sigue ocupando su inicio (`getMissingStarts`). Sirve para
  las generadas por error. El servidor rechaza el lote si
  alguna ya no está pendiente. Las de estado piden confirmación.
- En el detalle de un trabajo, «Revisar pendientes» abre el mismo panel ahí
  mismo, con el aviso de Inicio y las visitas de ese trabajo de todas las
  fechas. Conserva los filtros de antigüedad y equipo, la selección por día
  y las acciones individuales y en lote. El servidor verifica el trabajo al
  recibir un lote desde el detalle.

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
`pnpm check:pending-visits` cubre pendientes, sus grupos y lo que Inicio
dice de hoy y de la semana.

## Reglas de calendario

Página `/dashboard/jobs/rules` (feature 73, diseño de Claude Design "Reglas
de calendario Bambu"), con el botón "Reglas de calendario" en Trabajos.
Código en `components/ops/schedule-rules/`.

- Matriz: una fila por trabajo en curso (no archivado ni completado, en curso
  o con reglas activas), una columna por día y una "Mensual". Cada regla
  activa es un bloque; un día vacío crea un horario y un bloque lo abre.
- Avisos (`schedule-rules-model.ts`): sin horario, dos reglas vigentes que se
  cruzan el mismo día y horario vencido. Filtros Todos / Sin horario / Con
  avisos y búsqueda por nombre o dirección.
- Panel: al costado desde 1320 px de ancho de la página; más angosto, hoja
  lateral no modal (la matriz y el "Deshacer" siguen tocables). Menos de
  896 px: diseño de celular (lista, semana del servicio, hoja de nuevo
  horario, horario y limpiar).
- Crear puede generar las visitas hasta fin del mes siguiente. Editar con
  "El cambio corre desde" rehace las visitas sin tocar desde esa fecha (o
  hoy) hasta la semana de la última visita que ya tenía
  (`lib/ops/schedule-rule-apply.ts`); no genera más allá.
- Limpiar visitas (`lib/ops/schedule-rule-cleanup.ts`): hacia adelante desde
  el lunes de la semana de corte o hacia atrás hasta su domingo. Archiva, en
  una transacción, solo las programadas sin horario real ni horas; las
  cuentas usan todas las visitas de la regla, también las que no entran en
  la tira de 16 semanas. Opcional: terminar la regla el día anterior o
  moverle el inicio al día siguiente. "Deshacer" las desarchiva y devuelve
  las fechas. "Eliminar el horario" limpia desde hoy y desactiva la regla.
- `pnpm check:schedule-rules-board`. Datos de prueba para un Postgres local:
  `scripts/smoke-schedule-rules-seed.ts`.

# Feature 17 - `ops_visits_guided_intents`

Rama `feat/17-ops-visits-guided-intents`, desde `main` en `044f7ad`. Código en
`e8dcff2`.

## Qué cambió

- `JobOccurrenceDialog` recibe `intent: "schedule" | "complete"`, obligatorio,
  en lugar de `completeOnSave`. El tipo `OccurrenceDialogIntent` vive en
  `job-occurrence-dialog-utils.ts`.
  - `schedule` abre la visita tal cual (o vacía al crear).
  - `complete` precarga el horario real con el programado si falta y marca
    Realizada una visita Programada. Una visita con otro estado lo conserva.
  - Se guarda con los mismos `createOccurrence` y `updateOccurrence`: no
    cambió ningún contrato.
  - Copia: `complete` dice "Horario real" / "Registrar visita". El botón dice
    "Completar visita" cuando el estado del formulario es Realizada y
    "Guardar visita" en cualquier otro caso (por ejemplo, al registrar el
    horario de una visita Omitida).
- Llamadores: agenda y lista/tarjetas (`getVisitDialogIntent`, que reemplaza
  a `shouldCompleteOccurrenceOnSave`), panel de ocurrencias del trabajo
  (Programada → `complete`), pendientes (`pending` → `complete`, `tomorrow`
  → `schedule`), cronograma (`schedule`), y los cuatro "Nueva visita"
  (`schedule`).
- Se mantiene la carga al abrir que controla `check:occurrence-generation`.
- Vista Cards → "Tarjetas"; el valor guardado sigue siendo `cards`. El
  selector de vistas es 2x2 en celulares (a 390 px desbordaba 40 px, ya
  pasaba con "Cards") y una fila desde `sm`.
- Agenda del calendario:
  - `CalendarAgendaError`: error con Reintentar (44 px) cuando el mes no tiene
    datos y ya no está cargando.
  - `CalendarAgendaStaleNotice`: aviso con Reintentar si falla un refresco
    con visitas en pantalla. Las visitas quedan visibles.
  - `useJobOccurrences` expone `hasData`.
  - `monthIsEmpty` del panel del mes exige datos cargados.
- Por qué "no está cargando y no hay datos" y no `error && !hasData`: TanStack
  pausa los reintentos si la pestaña está oculta u offline. La consulta
  queda `pending` + `paused`, sin `error` y con `isLoading` en falso, y la
  agenda mostraba "No hay visitas para este día". El smoke lo encontró.

## Verificación

- PASS: `init.ps1`, `tsc`, `pnpm lint`, los 31 `check:*` y `next build`
  (sin `prisma generate`: había un servidor de desarrollo con el motor de
  Prisma bloqueado y el schema no cambió).
  - `check:occurrence-dialog` usa la API de intents:
    - `complete` completa y precarga; `schedule` no toca estado ni horario.
    - El intent de agenda o lista depende del equipo y del horario real.
    - Completar no pisa un estado que no es Programada.
    - Cada `<JobOccurrenceDialog` de los 8 archivos llamadores pasa
      `intent=`, y no queda ningún `completeOnSave`.
  - `check:visits-view` es nuevo y controla:
    - El orden, las etiquetas y los valores de las vistas; `cards` sigue
      siendo válido y Calendario es la vista por defecto.
    - Que la agenda chequee carga, después error y después día vacío, más el
      aviso de refresco fallido.
  - Mutaciones atrapadas: volver a "Cards", quitar el intent del cronograma,
    `completing = true` fijo y saltear la rama de error de la agenda.
- Smoke en el Chrome del usuario, sin escribir datos. Los errores se forzaron
  con un `fetch` interceptado en la página que responde 500 sin llegar al
  servidor.
  - Escritorio:
    - Calendario por defecto y "Tarjetas" en el selector. Elegir Tarjetas
      guarda `{"view":"cards"}`.
    - Carga: skeleton durante los reintentos y después el error, nunca el
      día vacío.
    - Reintentar con Tab + Enter (anillo de foco visible) carga el mes:
      febrero de 2027 queda vacío con su estado vacío.
    - Refresco fallido de septiembre: el aviso aparece sobre las 10 visitas.
      Reintentar muestra "Reintentando..." deshabilitado y el aviso se va al
      cargar.
    - "Registrar horario" con Enter abre "Registrar visita" con el foco
      adentro, Realizada y el horario real 08:00-12:00. "Completar visita"
      envía `updateOccurrence` con `status: "DONE"` y el horario real igual
      al programado (bloqueado). El diálogo se reabre y la visita sigue
      Programada.
    - Editar una visita Realizada: "Editar visita", "Guardar visita", sin
      cambios. Registrar una Omitida: conserva Omitida y el botón dice
      "Guardar visita". "Nueva visita": "Crear visita", Programada y sin
      horarios.
  - 390x844: la ventana de Chrome estaba minimizada y no se podía
    redimensionar, así que se probó en un iframe del mismo origen de
    390x844.
    - Sin scroll horizontal y selector 2x2.
    - El diálogo de completar abre como hoja inferior con botones de 44 px.
    - Error de la agenda con Reintentar de 44 px.
- Queda fuera:
  - Con el mes caído, el panel del mes muestra los contadores en 0.
  - Refrescar espera a las opciones de filtro: con la pestaña oculta, esa
    consulta se pausa y el refresco queda colgado.
  - El toast de un server action fallido sale en inglés ("An unexpected
    response was received from the server.").

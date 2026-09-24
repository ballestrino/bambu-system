# Feature 9 - `ops_occurrence_scheduling_refactor`

Rama `feature/9-occurrence-reads`, desde `main` en `2c6fc56`.

## Decisiones del usuario

- La generación de visitas es manual, por un rango de fechas elegido
  ("desde/hasta"). Hay botones en el Cronograma, en el Calendario y en las
  reglas de calendario de cada trabajo. Por ejemplo, un servicio que arranca
  el 25 se genera del 25 al 31.
- Tres puntos que el usuario no eligió; se tomó lo más conservador y queda
  para confirmar:
  - Crear o editar una regla ya no genera visitas. El aviso de éxito dice que
    se generan con "Generar".
  - Se pueden generar días pasados, con un aviso en la confirmación.
  - Cambiar el horario de una regla no reemplaza las visitas ya generadas.
    Pasaba antes y sigue pasando: al volver a generar se suman las del
    horario nuevo. Queda pendiente decidir si se reemplazan las futuras que
    nadie tocó.

## Qué cambió

- Lecturas: `getJobOccurrences` y `getVisitWeek` son solo de lectura. Antes
  llamaban a `ensureJobOccurrencesForRange` en cada carga: una consulta de
  reglas y una por regla, y `createMany` si faltaban días.
- Un solo comando con nombre, en `lib/ops/job-occurrence-generator.ts`, en
  dos variantes. `previewOccurrenceGeneration` calcula sin escribir y
  `generateOccurrences` escribe. Es idempotente: si ya hay una visita en ese
  horario, aunque esté archivada o movida a mano, no se crea otra.
- La ventana de cada regla (`getRuleGenerationWindow`, recurrencia pura y
  testeable) va del inicio al fin de la regla dentro del rango pedido y nunca
  pasa el horizonte de 3 meses. Antes nunca generaba antes de hoy, así que una
  regla creada a mitad de semana dejaba sin generar los días anteriores de
  esa semana.
- Rango: `schemas/ops/occurrence-generation.ts` acepta fechas `YYYY-MM-DD` y
  hasta 93 días. `lib/ops/occurrence-generation-range.ts` lo pasa a días
  completos en Montevideo y avisa si arranca en el pasado o si lo corta el
  horizonte.
- Acciones: `actions/ops/occurrence-generation.ts` (admin y schema) y su
  adaptador `generate-job-occurrences.action.ts`. El horizonte viaja como
  fecha `YYYY-MM-DD`, porque el adaptador serializa con JSON.
- UI: `GenerateOccurrencesDialog`, con rangos sugeridos, "Desde/Hasta", vista
  previa ("Se van a crear N visitas de M trabajos") y la confirmación:
  - Cronograma: "Generar semana", y un aviso si la semana no tiene visitas;
  - Calendario: "Semana del día", "Todo el mes" y "Del día a fin de mes", y un
    aviso si el mes no tiene visitas;
  - reglas del trabajo: "Generar visitas" para todo el trabajo y "Generar"
    por regla, con "7 días", "Hasta fin de mes" y "4 semanas" desde hoy o
    desde el inicio de la regla.
- Diálogo de visita: empleadas, trabajos y reglas del trabajo se cargan al
  abrirlo. Cada visita de la agenda monta su diálogo cerrado, y las reglas
  hacían una llamada por visita.
- `actions/ops/job-occurrences.ts` quedó en 200 líneas. Ningún archivo de la
  agenda pasa de 200.

## Reemplazo de visitas que ya no coinciden (pedido del usuario)

- En el mismo diálogo, la vista previa lista las visitas del alcance y del
  rango que ya no coinciden con su regla. El motivo puede ser el día u
  horario, la duración, el equipo (distinto del que las asignaciones del
  trabajo ponen en esa fecha) o que la regla esté inactiva.
- Solo entran visitas futuras, programadas, sin separar de la regla y que
  nadie tocó: sin edición, sin horario real y sin horas cargadas. Moverla en
  el Cronograma cuenta como edición. Las editadas no coincidentes solo se
  cuentan ("se mantienen").
- Nada viene marcado. Se marca de a una, por motivo o todas, y el botón dice
  qué va a pasar ("Generar N y borrar M"). En el servidor, borrar recalcula
  la lista y solo borra los ids elegidos que siguen siendo reemplazables, con
  las mismas condiciones en el `deleteMany`. Después genera lo que falta, o
  sea las recreadas con el horario o el equipo actual.
- Se borran de verdad, no se archivan: no tienen datos propios, y una
  archivada impediría volver a generar en ese horario.
- Código: `lib/ops/occurrence-replacement.ts` (puro: motivos, equipo según
  asignaciones, "intacta") y `lib/ops/occurrence-replacement-query.ts`
  (consulta y borrado). `resolveEmployeeIds` pasó a ese módulo, así la
  generación y el reemplazo deciden el equipo igual.
- Hallazgo en producción (vista previa del 24/9 al 22/11): 184 visitas
  futuras sin tocar no coinciden con su regla. 75 son de reglas inactivas
  (por ejemplo, Florencia Punta Gorda tiene sus 3 reglas archivadas y sigue
  con visitas), 53 de día u horario (Oficina Lazarina pasó a martes y viernes
  el 28/8 y quedaron lunes), 18 de duración y 67 de equipo. Otras 26 no
  coinciden pero fueron editadas. Por ese volumen, la selección arranca
  vacía y no toda marcada. No se borró nada.

## Medición (criterio 5)

- `next dev` local contra la base de producción, en el Chrome del usuario,
  tres cargas de `/dashboard/calendar`. Se midió el fin de la última acción de
  servidor:
  - antes del arreglo de las reglas: 3,89, 3,77 y 3,75 s (mediana 3,77 s),
    con 13 acciones por carga, 11 de ellas `getJobScheduleRulesAction`;
  - después: 1,38, 1,37 y 1,46 s (mediana 1,38 s), con 2 acciones por carga
    (`getJobOccurrencesAction` y `getVisitFilterOptionsAction`).

## Verificación

- PASS: `check:occurrence-generation` (nuevo), con 21 de 21 mutaciones
  detectadas, 8 de ellas del reemplazo. Cubre:
  - los motivos de reemplazo, el equipo por asignaciones, "intacta", la
    selección vacía por defecto y el borrado recalculado en el servidor;
  - el rango, la ventana de la regla con y sin horizonte, y las fechas
    candidatas;
  - los rangos sugeridos y el schema;
  - por texto fuente: ninguna lectura genera, las reglas no generan al
    guardar, la vista previa no escribe, admin en las dos acciones, botones en
    las tres pantallas y el diálogo cargando al abrir.
- PASS: los 27 `check:*`, `tsc`, ESLint, harness y `next build`. El
  manifiesto solo suma las dos acciones de generar.
- PASS: smoke con sesión en el Chrome del usuario:
  - las tres vistas previas: semana, mes, del día a fin de mes, fechas
    editadas a mano, rango inválido con el botón deshabilitado, y las reglas
    del trabajo (7 días, 4 semanas y trabajo sin reglas);
  - con permiso del usuario, se generaron las 2 visitas que faltaban del 21
    al 27 de setiembre (Godoy y Guillermo Hogar, lunes 21, programadas, de su
    regla y con su empleada). La vista previa pasó a "No hay visitas para
    generar", así que volver a generar no duplica;
  - el diálogo de editar una visita carga el equipo y la regla al abrirse.
- Corregido en el smoke: el diálogo no se cerraba después de generar. Ahora
  espera la respuesta con `mutateAsync` y la recarga de datos no bloquea el
  cierre. Además, el `label` del rango sugerido dejó de viajar al servidor.
  No se pudo volver a probar sin crear más visitas.
- PASS (2026-09-24): smoke del usuario del criterio 7 (crear, editar y
  guardar, separar de la regla y archivar) y del reemplazo con datos que él
  eligió: "funciona".

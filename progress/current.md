# Current Harness Session

Status: idle

## Active Feature

- None.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.
- Próxima: 13 `agent_test_data_cleanup`. Escribe en la base de producción
  (`.env`): primero una consulta de solo lectura, después el permiso
  explícito del usuario.
- Para la 15: resend ya está en 6.30.0 desde la 11.

## Last Closed Work

- 2026-09-28: huecos de sueldos (12), en `main` sin push. Los datos ya se
  escribieron en producción. Hasta el push, el deploy muestra el cálculo
  viejo: junio −26.946 y agosto −99.020, en lugar de "Sin registro".
- 2026-09-28: parche de dependencias con avisos altos (11), pusheado
  (`origin/main` en `2a464de`). Hay que confirmar que el cron de correo
  sincronice bien con mailparser 3.9.20.
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
- Cargar en Finanzas → Pagos los sueldos de agosto pagados en septiembre (lo
  hace el usuario). Hasta entonces, septiembre muestra $ 120.354 pendientes.

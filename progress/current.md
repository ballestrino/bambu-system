# Current Harness Session

Status: idle

## Active Feature

- None.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.
- Próxima: 11 `security_dependency_patch`.
- Las 12 y 13 escriben en la base de producción (`.env`): primero una
  consulta de solo lectura, después el permiso explícito del usuario.

## Last Closed Work

- 2026-09-24: limpieza y renumeración del feature_list, en `main` sin push.
- 2026-09-24: generación manual de visitas (vieja 9, nueva 3), en `main` sin
  push.
- Último push a `origin/main`: 2026-09-23 (`2c6fc56`, deploy de Vercel Ready).

## Decisiones pendientes del usuario

- Qué hacer con los precios con centavos de los presupuestos guardados antes
  de las reglas de precio del agente.
- Si "Abrir en página" se ofrece también desde el Sheet de crear del agente.
- Un `replaceState` durante una navegación pendiente en la página del agente,
  a confirmar.
- Qué período usa la rentabilidad de Trabajos cuando el control de mes deje de
  ser global (se decide en la 18).

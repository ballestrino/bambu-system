# Current Harness Session

Status: in_progress

## Active Feature

- 11 `security_dependency_patch`, en la rama
  `feature/11-security-dependency-patch` (código en `b61deab`). La
  verificación está en verde; falta el OK del usuario para cerrarla y
  mergearla.
- Decisiones del usuario (2026-09-28): nodemailer 9.1.1 (no la 10), sacar
  `uuid` y subir resend a la última estable (6.30.0) en esta feature, no en
  la 15.
- `pnpm audit --prod`: de 22 altas a 0, con 1 moderada documentada. El
  audit completo: de 32 altas a 0.
- PASS: `tsc`, lint, los 27 `check:*`, `pnpm build`, la ida y vuelta
  nodemailer → mailparser en Node y el smoke con sesión de la bandeja y del
  Excel de Trabajos. Detalle y excepciones en
  `progress/impl_security_dependency_patch.md`.
- Fuera de alcance: error de hidratación en el botón "Nuevo correo" de
  `/dashboard/email`. Se reprodujo igual en `main`, así que ya estaba.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.
- Activa: 11 `security_dependency_patch`.
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

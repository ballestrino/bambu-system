# Current Harness Session

Status: in_progress

## Active Feature

- 13 `agent_test_data_cleanup`, en la rama
  `feature/13-agent-test-data-cleanup` (solo documentación). El usuario
  aprobó borrar las 5 documentadas y las 2 dudosas. Se borraron las 7, y la
  segunda consulta confirmó que las 21 restantes no cambiaron. Falta el OK
  para cerrarla y mergearla. Detalle en
  `progress/impl_agent_test_data_cleanup.md`.
- Consulta del 2026-09-28:
  - Presupuestos con "prueba" en el nombre: 0. Los 5 de la feature ya los
    había borrado el usuario.
  - Conversaciones del agente: 28 (26 de Nacho, 2 de Romina del 24/9, que no
    se tocan).
  - Pruebas documentadas en `progress/impl_agent_*`, propuestas para borrar:
    - `XHo5WXUCPErs4QKa` "Prueba de la página del agente";
    - `dP33WZUbjDPDTXyP` "Visitas y horas presupuestadas semanalmente" (su
      vínculo al presupuesto Edificio Guaraní queda en null);
    - `J2bqeC6BQ0m0YEod` "Presupuesto de limpieza de oficina 2 veces por
      semana";
    - `ydl6JGJMQBKKQWTX` "Presupuesto de limpieza de oficina" (21/9; hay otra
      con el mismo título, de Romina);
    - `F3mPcDUhL2tzP2Ur` "Cotización de limpieza para ferretería".
  - Dudosas, para que decida el usuario: `1WwpMtscLxpRpyYE` (23/9, el mismo
    mensaje que una prueba) y `9GUnGegLEXJ0I8a3` (21/9, del usuario durante
    el smoke de la página).
  - El resto son pedidos reales de clientes o consultas del usuario.
  - Borrar una conversación borra en cascada sus mensajes y propuestas. Los
    `AgentUsageEvent` quedan con `conversationId` null (se conserva el
    costo) y `AgentAuditEvent` no se toca.

## Queue

- `feature_list.json` se renumeró el 2026-09-24: las ids 1–10 son contexto
  terminado y la cola va de la 11 a la 20, en orden de prioridad. La tabla de
  equivalencias con los ids viejos está en `progress/history.md`.
- Activa: 13 `agent_test_data_cleanup`. Escribe en la base de producción
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

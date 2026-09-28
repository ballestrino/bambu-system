# Feature 13 - `agent_test_data_cleanup`

Tarea solo de datos, en la base de producción. No hay cambios de código.

## Consulta de solo lectura (2026-09-28)

- Presupuestos con "prueba" en el nombre: 0. Los 5 de la feature ("Prueba
  agente 43 cálculo", "Prueba agente 43 propuesta", "Prueba 43 aporte vacío",
  "Prueba 43 propuesta editada" y "Prueba 43 confirmar con borrador") ya los
  había borrado el usuario.
- Conversaciones del agente: 28 (26 de Nacho y 2 de Romina del 24/9). Se
  clasificaron cruzando los títulos con `progress/impl_agent_page.md`,
  `impl_agent_pricing_rules.md` e `impl_agent_budget_editor.md`, y leyendo el
  primer mensaje de cada una.
  - 5 pruebas documentadas, de los smokes del 21 y 22/9.
  - 2 dudosas: una del 23/9 con el mismo mensaje que una prueba, y una que el
    usuario escribió durante el smoke de la página del agente.
  - 19 de uso real: pedidos de clientes con datos de contacto y consultas del
    usuario. Las 2 de Romina no se tocaron.

## Borrado aprobado por el usuario

Aprobó las 5 documentadas y también las 2 dudosas:

| Id | Título |
| --- | --- |
| `XHo5WXUCPErs4QKa` | Prueba de la página del agente |
| `dP33WZUbjDPDTXyP` | Visitas y horas presupuestadas semanalmente |
| `J2bqeC6BQ0m0YEod` | Presupuesto de limpieza de oficina 2 veces por semana |
| `ydl6JGJMQBKKQWTX` | Presupuesto de limpieza de oficina (la del 21/9, no la de Romina) |
| `F3mPcDUhL2tzP2Ur` | Cotización de limpieza para ferretería |
| `1WwpMtscLxpRpyYE` | Presupuesto de limpieza de oficina semanal |
| `9GUnGegLEXJ0I8a3` | Presupuesto de oficina 3 días semanales |

- Script de un solo uso en `tmp/` (ignorado; se borró después de correrlo).
  Verificaba id, título y usuario de las 7 antes de borrar, y el
  `deleteMany` corría en una transacción que se revertía si no borraba
  exactamente 7.
- En cascada: 40 `AgentMessage` y 6 `AgentProposal`. Los 29
  `AgentUsageEvent` quedaron con `conversationId` null, así que el costo del
  mes no cambia. `AgentAuditEvent` no se tocó. El presupuesto Edificio
  Guaraní solo perdió el vínculo con su conversación.

| | Antes | Después |
| --- | --- | --- |
| Presupuestos | 206 | 206 |
| Conversaciones | 28 | 21 |
| Mensajes | 140 | 100 |
| Propuestas | 26 | 20 |
| Consumos (total / sin conversación) | 168 / 46 | 168 / 75 |
| Auditoría | 84 | 84 |
| Conversaciones de Romina | 2 | 2 |

## Verificación

- La segunda consulta de solo lectura confirmó que no queda ninguna de las 7 y
  que las 21 restantes son exactamente las que no se tocaban.

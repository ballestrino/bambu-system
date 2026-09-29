# Feature 21 - Modos del agente

Fecha: 2026-09-29. Estado: verificado localmente. El usuario autorizó commit
y push a main, incluyendo los commits anteriores pendientes de publicación.

- Bajo vuelve a estar activo y es el default: `gpt-6-luna`, `xhigh`.
- Medio: `gpt-6.1-sol`, `low`. Alto: `gpt-6.1-sol`, `medium`.
- Ruta, settings, selector y variables de entorno aceptan los tres modos.
- Las conversaciones guardadas conservan su modo. Modelos, razonamiento
  y costos históricos permanecen sin cambios; no hay migración ni escritura
  de datos durante la verificación.
- Etiqueta `Sol 6.1` y Standard USD por millón: entrada 2, caché 0.10,
  escritura 2.50, salida 10. Fuente verificada el 2026-09-29:
  https://developers.openai.com/api/docs/models/gpt-6.1-sol
- Títulos siguen con Luna 6 medium; `draftEmail` sigue el modo seleccionado.

## Verificación

- PASS: `pnpm check:ai-gateway`, `pnpm check:agent-sheet`.
- PASS: `pnpm exec tsc --noEmit`, `init.ps1` (harness, Prisma y lint).
- PASS: `git diff --check`.
- Smoke autenticado en Brave, `http://localhost:3010/dashboard/agent`:
  nueva conversación Bajo; menú con Bajo/Luna 6, Medio/Sol 6.1 y Alto/Sol 6.1;
  selección de Medio muestra `low`, Alto muestra `medium`; Nueva conversación
  vuelve a Bajo y el tooltip muestra `gpt-6-luna` / `xhigh`.
- No se enviaron mensajes ni se cambiaron conversaciones persistidas.
- No se hizo una llamada real a los modelos ni un build: no cambió el
  framework, las rutas, auth o el esquema. La compatibilidad de los niveles
  low/medium y Responses con tools se confirmó en documentación oficial.
- El primer init falló por permisos de lectura del sandbox en dependencias;
  repetir fuera del sandbox pasó. Dev se detuvo y se retiró el bloque
  generado automáticamente por Next en AGENTS.md.

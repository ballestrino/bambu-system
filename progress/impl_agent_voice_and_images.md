# Feature 23 - Dictado e imágenes en el agente (`agent_voice_and_images`)

Rama `feature/23-agent-voice-images`. Pedida por el usuario el 2026-10-08:
micrófono con `gpt-transcribe` (elegido por calidad para notas de 30 s) y un
"+" para subir hasta 7 imágenes por mensaje, respetando los límites de
Next.js/Vercel y OpenAI.

## Decisiones

- **Una imagen por pedido.** Vercel corta todo pedido de más de 4,5 MB: siete
  fotos en el mensaje no entran. Cada imagen se achica en el navegador (1600
  px, JPEG 0,82, unos 300 KB) y se sube al elegirla; el mensaje lleva solo su
  dirección.
- **Bytes en la base** (`AgentAttachment`), no en `AgentMessage.parts`: abrir
  una conversación no trae megas, la ruta las sirve con caché privado y se
  borran en cascada con el mensaje. Sin servicio nuevo (Cloudinary se sacó en
  la 15). Las no enviadas se borran a las 24 horas.
- **El modelo ve las 14 más recientes** como data URL (la ruta pide sesión);
  las anteriores quedan como aviso de texto. Acota tokens y memoria.
- **Dictado sin enviar solo**: el texto queda en el composer para revisarlo,
  porque un precio mal oído no se nota hasta que el agente responde.
- **OpenAI directo** para el dictado: `@ai-sdk/openai` 4.0.69 no conoce
  `gpt-transcribe` ni `keywords[]`/`languages[]`.
- **Costo por minuto** en `AgentUsageEvent` (`TRANSCRIPTION`, `audioSeconds`):
  "Costos de IA" lo muestra en minutos y en su fila "Dictado".
- **Prompt**: una imagen se lee como lo que escribió el usuario; un importe de
  una imagen no es fuente de precios.

## Qué cambió

- Migración aditiva `20261008120000_agent_attachments_transcription`.
- Rutas `POST /api/agent/attachments`, `GET /api/agent/attachments/[id]` y
  `POST /api/agent/transcribe`, con sesión de admin.
- `lib/agent/attachment-rules.ts` (límites compartidos), `attachment-store.ts`,
  `history-images.ts`, `model-attachments.ts`, `image-compress.ts`,
  `image-signature.ts`, `transcription.ts` y `transcription-hints.ts`;
  `lib/ai/transcription.ts` y `transcription-request.ts`; precios por minuto
  en `lib/ai/pricing.ts`.
- Turno: valida las imágenes antes de tocar la conversación, las vincula al
  guardar el mensaje y rechaza un reenvío con otras imágenes.
- Composer con "+" (`<label>` del input, para Safari en iOS), miniaturas,
  micrófono y barra de grabación; burbuja con las imágenes.
- `docs/agent.md` ("Imágenes y dictado", entorno, costos y verificación),
  `docs/architecture.md` y `.env.template` (`AI_TRANSCRIPTION_MODEL`).

## Verificación

- PASS: `tsc`, `pnpm lint`, `pnpm build`, `init.ps1`, los ocho `check:*` del
  agente y el nuevo `check:agent-attachments` (con
  `agent-attachment-source-checks.ts` y `agent-transcription-checks.ts`).
- PASS contra OpenAI: 13 s de audio en español con los campos del dictado,
  texto exacto con "Literal E" e "IVA", `usage.seconds` 13, US$ 0,000975.
- Migración aplicada en Neon con permiso del usuario.
- Smoke de solo lectura: rutas sin sesión → login; composer, menú "+" y
  "Costos de IA" en el Chrome del usuario, sin errores.
- No hecho: dictado con micrófono y subida de imágenes de punta a punta. El
  usuario eligió no crear datos de prueba y cerró la feature el 2026-10-08.

## Queda fuera

- Dictado en vivo (streaming) y el iPhone contra `pnpm dev` por IP (sin https
  no hay micrófono).
- El dictado del primer mensaje de una conversación nueva queda solo en el
  gasto del mes, no en el de la conversación.

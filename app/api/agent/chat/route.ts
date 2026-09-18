import { createIdGenerator, createUIMessageStreamResponse, toUIMessageStream } from "ai";
import { after } from "next/server";

import { generateConversationTitle } from "@/lib/agent/conversation-title";
import { toAgentErrorMessage } from "@/lib/agent/errors";
import type { AgentUIMessage } from "@/lib/agent/messages";
import { runAgentTurn } from "@/lib/agent/run";
import { finishAgentTurn, prepareAgentTurn } from "@/lib/agent/turn";
import { createUsageCollector, summarizeUsage } from "@/lib/agent/usage-collector";
import { requireAdminSession } from "@/lib/require-admin-session";
import { agentChatRequestSchema } from "@/schemas/agent";

// Ruta y no Server Action: una acción no puede devolver un stream de mensajes
// con partes de tools. Se mantiene fina: la lógica vive en lib/agent.
export const runtime = "nodejs";
// El máximo de Vercel Hobby sin Fluid compute. Con Fluid activo se puede
// subir a 300 si los turnos largos (Bajo con xhigh) lo necesitan.
export const maxDuration = 60;

const generateMessageId = createIdGenerator({ prefix: "msg", size: 16 });

const jsonError = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return jsonError("Necesitás iniciar sesión como administrador", 403);
  }

  const parsed = agentChatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Pedido inválido", 400);
  const body = parsed.data;
  const actor = { id: session.user.id, name: session.user.name ?? null };

  try {
    const turn = await prepareAgentTurn(actor, body);
    if (!turn.ok) return jsonError(turn.error, turn.status);

    const usage = createUsageCollector();
    const { result, tools } = await runAgentTurn({
      actorId: actor.id,
      conversationId: body.id,
      mode: body.mode,
      skill: body.skill,
      instructions: turn.instructions,
      messages: turn.messages,
      budgetContext: turn.budgetContext,
      grounding: turn.grounding,
      usage,
      abortSignal: request.signal,
    });

    if (turn.conversationCreated) {
      after(() =>
        generateConversationTitle({
          conversationId: body.id,
          actorId: actor.id,
          mode: body.mode,
          text: turn.userText,
        })
      );
    }

    const stream = toUIMessageStream<typeof tools, AgentUIMessage>({
      stream: result.stream,
      tools,
      originalMessages: turn.messages,
      generateMessageId,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return { mode: body.mode, skill: body.skill, createdAt: new Date().toISOString() };
        }
        if (part.type === "finish") return { usage: summarizeUsage(usage.entries()) };
        return undefined;
      },
      onEnd: ({ responseMessage }) =>
        finishAgentTurn({
          conversationId: body.id,
          responseMessage,
          mode: body.mode,
          skill: body.skill,
          entries: usage.entries(),
        }),
      onError: toAgentErrorMessage,
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Agent chat failed:", error);
    return jsonError(toAgentErrorMessage(error), 500);
  }
}

import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

import { auth } from '@/auth'
import { getSystemMessage } from '@/data/ai-system-message'
import { BudgetContext, formatBudgetForAI } from '@/lib/format-budget'

export const runtime = 'nodejs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type IncomingMessage = {
    role: 'user' | 'assistant'
    content: string
    imageUrl?: string | null
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return new Response('No autorizado', { status: 401 })
    }
    if (!process.env.OPENAI_API_KEY) {
        return new Response('Missing OPENAI_API_KEY', { status: 500 })
    }

    let body: { messages: IncomingMessage[]; context: BudgetContext }
    try {
        body = await req.json()
    } catch {
        return new Response('Invalid JSON body', { status: 400 })
    }

    const { messages, context } = body
    const systemMessage = getSystemMessage(formatBudgetForAI(context))

    const apiMessages: ChatCompletionMessageParam[] = messages.map((m) => {
        if (m.role === 'user' && m.imageUrl) {
            return {
                role: 'user',
                content: [
                    { type: 'text', text: m.content || '' },
                    { type: 'image_url', image_url: { url: m.imageUrl } },
                ],
            }
        }
        return { role: m.role, content: m.content }
    })

    let completion
    try {
        completion = await openai.chat.completions.create(
            {
                model: 'gpt-5.2-chat-latest',
                stream: true,
                messages: [systemMessage as ChatCompletionMessageParam, ...apiMessages],
            },
            { signal: req.signal }
        )
    } catch (err) {
        console.error('OpenAI create error:', err)
        return new Response('Failed to start generation', { status: 502 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                for await (const chunk of completion) {
                    const delta = chunk.choices?.[0]?.delta?.content
                    if (delta) controller.enqueue(encoder.encode(delta))
                }
            } catch (err) {
                const name = (err as { name?: string })?.name
                if (name !== 'AbortError') {
                    console.error('Stream error:', err)
                }
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
        },
    })
}

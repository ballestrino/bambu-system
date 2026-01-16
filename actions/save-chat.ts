'use server';

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function saveChat(messages: { role: string; content: string }[], budgetId?: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: 'No autorizado' };
    }

    try {
        // Create the chat
        const chat = await db.chat.create({
            data: {
                userId: session.user.id,
                budgetId: budgetId, // Optional
                name: "Chat de Presupuesto", // Default name, could be dynamic
                messages: {
                    create: messages.map(m => ({
                        role: m.role as Role, // user, assistant, system
                        content: m.content,
                    }))
                }
            }
        });

        return { success: true, chatId: chat.id };
    } catch (error) {
        console.error('Error saving chat:', error);
        return { error: 'Error al guardar el chat' };
    }
}

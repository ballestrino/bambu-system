'use server';

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function saveChat(messages: { role: string; content: string }[], budgetId?: string, name?: string, chatId?: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: 'No autorizado' };
    }

    try {
        if (chatId) {
            // Update existing chat
            // First verify ownership
            const existingChat = await db.chat.findUnique({
                where: { id: chatId, userId: session.user.id }
            });

            if (!existingChat) {
                return { error: 'Chat no encontrado o no autorizado' };
            }

            // Transaction: Update chat metadata, delete old messages, insert new ones (full sync)
            // Ideally we'd optimize this, but for now this ensures consistency.
            await db.$transaction(async (tx) => {
                await tx.chat.update({
                    where: { id: chatId },
                    data: {
                        name: name || undefined, // Only update name if provided
                        updatedAt: new Date(),
                    }
                });

                // Delete existing messages to replace them with the current state
                await tx.message.deleteMany({
                    where: { chatId: chatId }
                });

                // Create new messages
                await tx.message.createMany({
                    data: messages.map(m => ({
                        chatId: chatId,
                        role: m.role as Role,
                        content: m.content,
                    }))
                });
            });

            return { success: true, chatId: chatId };
        } else {
            // Create new chat
            const chat = await db.chat.create({
                data: {
                    userId: session.user.id,
                    budgetId: budgetId,
                    name: name || "Chat de Presupuesto",
                    messages: {
                        create: messages.map(m => ({
                            role: m.role as Role,
                            content: m.content,
                        }))
                    }
                }
            });
            return { success: true, chatId: chat.id };
        }
    } catch (error) {
        console.error('Error saving chat:', error);
        return { error: 'Error al guardar el chat' };
    }
}

export async function getChats(budgetId?: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: 'No autorizado' };
    }

    try {
        const chats = await db.chat.findMany({
            where: {
                userId: session.user.id,
                ...(budgetId && { budgetId })
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return { success: true, chats };
    } catch (error) {
        console.error('Error fetching chats:', error);
        return { error: 'Error al obtener los chats' };
    }
}

export async function deleteChat(chatId: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: 'No autorizado' };
    }

    try {
        await db.chat.delete({
            where: {
                id: chatId,
                userId: session.user.id
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error deleting chat:', error);
        return { error: 'Error al eliminar el chat' };
    }
}

export async function renameChat(chatId: string, newName: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: 'No autorizado' };
    }

    try {
        await db.chat.update({
            where: {
                id: chatId,
                userId: session.user.id
            },
            data: {
                name: newName
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error renaming chat:', error);
        return { error: 'Error al renombrar el chat' };
    }
}

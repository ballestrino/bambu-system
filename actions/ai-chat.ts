'use server';

import OpenAI from 'openai';

import { getSystemMessage } from '@/data/ai-system-message';
import { formatBudgetForAI } from '@/lib/format-budget';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function submitChat(messages: any[], context: any) {
    if (!process.env.OPENAI_API_KEY) {
        return { error: 'OpenAI API key not configured' };
    }

    try {
        const contextText = formatBudgetForAI(context);
        const systemMessage = getSystemMessage(contextText);

        const response = await openai.chat.completions.create({
            model: 'gpt-5.2',
            messages: [systemMessage, ...messages],
        });

        return { message: response.choices[0].message };
    } catch (error) {
        console.error('AI Chat Error:', error);
        return { error: 'Failed to generate response' };
    }
}

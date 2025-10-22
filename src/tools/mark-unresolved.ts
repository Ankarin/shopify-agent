import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createMarkAsUnresolvedTool = (chatId: string) => tool({
    description: 'Mark this conversation as UNRESOLVED when you do NOT understand what the customer is asking and need to give a fallback message. Use this ONLY when you genuinely cannot comprehend the intent and must say something like "Sorry, I can\'t answer that right now. Please email [support] with your inquiry."',
    inputSchema: z.object({
        reason: z.string().describe('Brief reason why you cannot understand or help (e.g., "unclear question", "outside knowledge", "ambiguous request")'),
    }),
    execute: async ({ reason }) => {
        console.log('⚠️ [Tool: markAsUnresolved] Marking chat as unresolved:', chatId, 'Reason:', reason);

        try {
            await db
                .update(chats)
                .set({ unresolved: 1, resolved: 0 })
                .where(eq(chats.id, chatId));

            console.log('⚠️ [Tool: markAsUnresolved] Chat marked as unresolved');

            return `Conversation marked as unresolved: ${reason}`;
        } catch (error: any) {
            console.error('❌ [Tool: markAsUnresolved] Error:', error);
            throw new Error('Failed to mark conversation as unresolved');
        }
    },
});


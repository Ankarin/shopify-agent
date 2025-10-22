import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createMarkAsResolvedTool = (chatId: string) => tool({
    description: 'Mark this conversation as RESOLVED when you have successfully answered the customer\'s question or provided clear next steps. Use this when you understand the intent and gave helpful guidance (e.g., answered FAQ, looked up order, provided product info, or gave specific instructions like "email info@example.com to start a return").',
    inputSchema: z.object({
        resolution: z.string().describe('Brief description of how you resolved it (e.g., "provided order tracking", "answered FAQ about shipping", "gave return instructions")'),
    }),
    execute: async ({ resolution }) => {
        console.log('✅ [Tool: markAsResolved] Marking chat as resolved:', chatId, 'Resolution:', resolution);

        try {
            await db
                .update(chats)
                .set({ resolved: 1, unresolved: 0 })
                .where(eq(chats.id, chatId));

            console.log('✅ [Tool: markAsResolved] Chat marked as resolved');

            return `Conversation marked as resolved: ${resolution}`;
        } catch (error: any) {
            console.error('❌ [Tool: markAsResolved] Error:', error);
            throw new Error('Failed to mark conversation as resolved');
        }
    },
});


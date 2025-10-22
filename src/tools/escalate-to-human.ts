import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createEscalateToHumanTool = (chatId: string) => tool({
    description: 'Escalate this conversation to a human agent when the customer needs human support. Use this when the issue requires manual intervention (refunds, cancellations, account changes), the customer explicitly requests to speak with a human, or the problem is too complex. This marks the conversation as RESOLVED because you successfully helped by providing the next steps.',
    inputSchema: z.object({
        reason: z.string().describe('Brief reason for escalation (e.g., "refund request", "complex issue", "customer requested")'),
    }),
    execute: async ({ reason }) => {
        console.log('🚨 [Tool: escalateToHuman] Escalating chat:', chatId, 'Reason:', reason);

        try {
            await db
                .update(chats)
                .set({ resolved: 1, unresolved: 0 })
                .where(eq(chats.id, chatId));

            console.log('✅ [Tool: escalateToHuman] Chat marked as resolved (escalated to human)');

            return `I've escalated this conversation. A human support agent will reach out to you soon regarding: ${reason}`;
        } catch (error: any) {
            console.error('❌ [Tool: escalateToHuman] Error:', error);
            throw new Error('Failed to escalate conversation');
        }
    },
});


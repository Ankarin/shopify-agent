import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createSaveCustomerEmailTool = (chatId: string) => tool({
    description: 'Save the customer email address to the chat record when they provide it for order verification. Use this when a customer provides their email to look up orders.',
    inputSchema: z.object({
        email: z.string().email().describe('The customer email address they provided'),
    }),
    execute: async ({ email }) => {
        console.log('💾 [Tool: saveCustomerEmail] Saving email for chat:', chatId, 'Email:', email);

        try {
            await db.update(chats)
                .set({ customerEmail: email })
                .where(eq(chats.id, chatId));

            console.log('✅ [Tool: saveCustomerEmail] Email saved successfully');
            return `Email address saved. I can now look up your orders.`;
        } catch (error: any) {
            console.error('❌ [Tool: saveCustomerEmail] Error:', error);
            throw new Error('Failed to save email address');
        }
    },
});


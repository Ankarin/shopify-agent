import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createSaveCustomerPhoneTool = (chatId: string) => tool({
    description: 'Save the customer phone number to the chat record. Use this IMMEDIATELY when a customer provides their phone number in the conversation.',
    inputSchema: z.object({
        phone: z.string().describe('The customer phone number they provided'),
    }),
    execute: async ({ phone }) => {
        console.log('💾 [Tool: saveCustomerPhone] Saving phone for chat:', chatId, 'Phone:', phone);

        try {
            await db.update(chats)
                .set({ customerPhone: phone })
                .where(eq(chats.id, chatId));

            console.log('✅ [Tool: saveCustomerPhone] Phone saved successfully');
            return `Phone number saved successfully. You can now help the customer with their inquiry.`;
        } catch (error: any) {
            console.error('❌ [Tool: saveCustomerPhone] Error:', error);
            throw new Error('Failed to save phone number');
        }
    },
});


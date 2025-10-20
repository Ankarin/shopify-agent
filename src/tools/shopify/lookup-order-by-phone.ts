import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createLookupOrderByPhoneTool = (shopifyClient: ShopifyClient, chatId: string) => tool({
    description: 'Look up orders for the current customer using their phone number that was provided during chat initialization.',
    inputSchema: z.object({
        limit: z.number().min(1).max(50).default(10).optional().describe('Number of orders to return (default 10, max 50). Use lower numbers for recent orders.'),
    }),
    execute: async ({ limit = 10 }) => {
        console.log('🔍 [Tool: lookupOrderByPhone] Called with chatId:', chatId, 'limit:', limit);
        const startTime = Date.now();

        try {
            const chat = await db.query.chats.findFirst({
                where: eq(chats.id, chatId),
            });

            if (!chat || !chat.customerPhone) {
                throw new Error('Customer phone not found.');
            }

            const phone = chat.customerPhone;

            const orders = await shopifyClient.getOrderByPhone(phone, limit);
            const duration = Date.now() - startTime;

            console.log(`📦 [Tool: lookupOrderByPhone] Found ${orders.length} orders in ${duration}ms`);

            if (orders.length === 0) {
                console.log('⚠️ [Tool: lookupOrderByPhone] No orders found');
                throw new Error('No orders found for this phone number.');
            }

            const formattedOrders = orders.map(order => shopifyClient.formatOrderInfo(order)).join('\n\n---\n\n');
            console.log(`✅ [Tool: lookupOrderByPhone] Success - Returning ${orders.length} formatted orders`);
            return formattedOrders;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: lookupOrderByPhone] Error after ${duration}ms:`, {
                chatId,
                limit,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to lookup orders: ${error.message}`);
        }
    },
});


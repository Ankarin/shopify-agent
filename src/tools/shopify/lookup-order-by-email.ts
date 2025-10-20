import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createLookupOrderByEmailTool = (shopifyClient: ShopifyClient, chatId: string) => tool({
    description: 'Look up orders for the current customer using their email that was provided during chat initialization.',
    inputSchema: z.object({
        limit: z.number().min(1).max(50).default(10).optional().describe('Number of orders to return (default 10, max 50). Use lower numbers for recent orders.'),
    }),
    execute: async ({ limit = 10 }) => {
        console.log('🔍 [Tool: lookupOrderByEmail] Called with chatId:', chatId, 'limit:', limit);
        const startTime = Date.now();

        try {
            const chat = await db.query.chats.findFirst({
                where: eq(chats.id, chatId),
            });

            if (!chat || !chat.customerEmail) {
                throw new Error('Customer email not found. Please provide your contact information.');
            }

            const email = chat.customerEmail;

            const orders = await shopifyClient.getOrderByEmail(email, limit);
            const duration = Date.now() - startTime;

            console.log(`📦 [Tool: lookupOrderByEmail] Found ${orders.length} orders in ${duration}ms`);

            if (orders.length === 0) {
                console.log('⚠️ [Tool: lookupOrderByEmail] No orders found for email:', email);
                throw new Error('No orders found for your account.');
            }

            const formattedOrders = orders.map(order => shopifyClient.formatOrderInfo(order)).join('\n\n---\n\n');
            console.log(`✅ [Tool: lookupOrderByEmail] Success - Returning ${orders.length} formatted orders`);
            return formattedOrders;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: lookupOrderByEmail] Error after ${duration}ms:`, {
                chatId,
                limit,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to lookup orders: ${error.message}`);
        }
    },
});


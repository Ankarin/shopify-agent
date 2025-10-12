import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createLookupOrderByPhoneTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Look up orders for a customer using their phone number. Use this when a customer asks about their order and provides their phone number.',
    inputSchema: z.object({
        phone: z.string().describe('The customer phone number'),
        limit: z.number().min(1).max(50).default(10).optional().describe('Number of orders to return (default 10, max 50). Use lower numbers for recent orders.'),
    }),
    execute: async ({ phone, limit = 10 }) => {
        console.log('🔍 [Tool: lookupOrderByPhone] Called with phone:', phone, 'limit:', limit);
        const startTime = Date.now();

        try {
            const orders = await shopifyClient.getOrderByPhone(phone, limit);
            const duration = Date.now() - startTime;

            console.log(`📦 [Tool: lookupOrderByPhone] Found ${orders.length} orders in ${duration}ms`);

            if (orders.length === 0) {
                console.log('⚠️ [Tool: lookupOrderByPhone] No orders found for phone:', phone);
                throw new Error('No orders found for this phone number.');
            }

            const formattedOrders = orders.map(order => shopifyClient.formatOrderInfo(order)).join('\n\n---\n\n');
            console.log(`✅ [Tool: lookupOrderByPhone] Success - Returning ${orders.length} formatted orders`);
            return formattedOrders;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: lookupOrderByPhone] Error after ${duration}ms:`, {
                phone,
                limit,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to lookup orders: ${error.message}`);
        }
    },
});


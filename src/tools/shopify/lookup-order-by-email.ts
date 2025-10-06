import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createLookupOrderByEmailTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Look up orders for a customer using their email address. Use this when a customer asks about their order and provides their email.',
    inputSchema: z.object({
        email: z.string().email().describe('The customer email address'),
        limit: z.number().min(1).max(50).default(10).optional().describe('Number of orders to return (default 10, max 50). Use lower numbers for recent orders.'),
    }),
    execute: async ({ email, limit = 10 }) => {
        console.log('🔍 [Tool: lookupOrderByEmail] Called with email:', email, 'limit:', limit);
        const startTime = Date.now();

        try {
            const orders = await shopifyClient.getOrderByEmail(email, limit);
            const duration = Date.now() - startTime;

            console.log(`📦 [Tool: lookupOrderByEmail] Found ${orders.length} orders in ${duration}ms`);

            if (orders.length === 0) {
                console.log('⚠️ [Tool: lookupOrderByEmail] No orders found for email:', email);
                throw new Error('No orders found for this email address.');
            }

            const formattedOrders = orders.map(order => shopifyClient.formatOrderInfo(order)).join('\n\n---\n\n');
            console.log(`✅ [Tool: lookupOrderByEmail] Success - Returning ${orders.length} formatted orders`);
            return formattedOrders;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: lookupOrderByEmail] Error after ${duration}ms:`, {
                email,
                limit,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to lookup orders: ${error.message}`);
        }
    },
});


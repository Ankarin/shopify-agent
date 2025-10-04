import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createLookupOrderByEmailTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Look up orders for a customer using their email address. Use this when a customer asks about their order and provides their email.',
    inputSchema: z.object({
        email: z.string().email().describe('The customer email address'),
    }),
    execute: async ({ email }) => {
        console.log('🔍 [Tool: lookupOrderByEmail] Called with email:', email);
        const startTime = Date.now();

        try {
            const orders = await shopifyClient.getOrderByEmail(email);
            const duration = Date.now() - startTime;

            console.log(`📦 [Tool: lookupOrderByEmail] Found ${orders.length} orders in ${duration}ms`);

            if (orders.length === 0) {
                console.log('⚠️ [Tool: lookupOrderByEmail] No orders found for email:', email);
                return { success: false, message: 'No orders found for this email address.' };
            }

            const formattedOrders = orders.map(order => shopifyClient.formatOrderInfo(order)).join('\n\n---\n\n');
            console.log(`✅ [Tool: lookupOrderByEmail] Success - Returning ${orders.length} formatted orders`);
            return { success: true, orders: formattedOrders };
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: lookupOrderByEmail] Error after ${duration}ms:`, {
                email,
                error: error.message,
                stack: error.stack,
            });
            return { success: false, message: `Failed to lookup orders: ${error.message}` };
        }
    },
});


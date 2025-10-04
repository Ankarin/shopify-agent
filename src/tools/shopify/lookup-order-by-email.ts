import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createLookupOrderByEmailTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Look up orders for a customer using their email address. Use this when a customer asks about their order and provides their email.',
    inputSchema: z.object({
        email: z.string().email().describe('The customer email address'),
    }),
    execute: async ({ email }) => {
        try {
            const orders = await shopifyClient.getOrderByEmail(email);
            if (orders.length === 0) {
                return { success: false, message: 'No orders found for this email address.' };
            }
            const formattedOrders = orders.map(order => shopifyClient.formatOrderInfo(order)).join('\n\n---\n\n');
            return { success: true, orders: formattedOrders };
        } catch (error: any) {
            console.error('Error looking up orders by email:', error);
            return { success: false, message: `Failed to lookup orders: ${error.message}` };
        }
    },
});


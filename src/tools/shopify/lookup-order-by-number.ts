import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createLookupOrderByNumberTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Look up a specific order using the order number (e.g., #1001). Use this when a customer provides their order number.',
    inputSchema: z.object({
        orderNumber: z.string().describe('The order number, including the # symbol if provided'),
    }),
    execute: async ({ orderNumber }) => {
        try {
            const order = await shopifyClient.getOrderByNumber(orderNumber);
            if (!order) {
                return { success: false, message: `Order ${orderNumber} not found.` };
            }
            return { success: true, order: shopifyClient.formatOrderInfo(order) };
        } catch (error: any) {
            console.error('Error looking up order by number:', error);
            return { success: false, message: `Failed to lookup order: ${error.message}` };
        }
    },
});


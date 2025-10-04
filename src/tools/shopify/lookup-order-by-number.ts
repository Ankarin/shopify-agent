import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createLookupOrderByNumberTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Look up a specific order using the order number (e.g., #1001). Use this when a customer provides their order number.',
    inputSchema: z.object({
        orderNumber: z.string().describe('The order number, including the # symbol if provided'),
    }),
    execute: async ({ orderNumber }) => {
        console.log('🔍 [Tool: lookupOrderByNumber] Called with order number:', orderNumber);
        const startTime = Date.now();

        try {
            const order = await shopifyClient.getOrderByNumber(orderNumber);
            const duration = Date.now() - startTime;

            if (!order) {
                console.log(`⚠️ [Tool: lookupOrderByNumber] Order not found after ${duration}ms:`, orderNumber);
                return { success: false, message: `Order ${orderNumber} not found.` };
            }

            console.log(`✅ [Tool: lookupOrderByNumber] Success in ${duration}ms - Order found:`, {
                orderNumber,
                orderId: order.id,
            });
            return { success: true, order: shopifyClient.formatOrderInfo(order) };
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: lookupOrderByNumber] Error after ${duration}ms:`, {
                orderNumber,
                error: error.message,
                stack: error.stack,
            });
            return { success: false, message: `Failed to lookup order: ${error.message}` };
        }
    },
});


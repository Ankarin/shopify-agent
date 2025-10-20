import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createLookupOrderByNumberTool = (shopifyClient: ShopifyClient, chatId: string) => tool({
    description: 'Look up a specific order using the order number (e.g., #1001). Use this when a customer provides their order number.',
    inputSchema: z.object({
        orderNumber: z.string().describe('The order number, including the # symbol if provided'),
    }),
    execute: async ({ orderNumber }) => {
        console.log('🔍 [Tool: lookupOrderByNumber] Called with order number:', orderNumber, 'chatId:', chatId);
        const startTime = Date.now();

        try {
            const chat = await db.query.chats.findFirst({
                where: eq(chats.id, chatId),
            });

            if (!chat || !chat.customerEmail) {
                throw new Error('Customer email not found. Please provide your contact information.');
            }

            const customerEmail = chat.customerEmail.toLowerCase();

            const order = await shopifyClient.getOrderByNumber(orderNumber);
            const duration = Date.now() - startTime;

            if (!order) {
                console.log(`⚠️ [Tool: lookupOrderByNumber] Order not found after ${duration}ms:`, orderNumber);
                throw new Error(`Order ${orderNumber} not found.`);
            }

            if (!order.email || order.email.toLowerCase() !== customerEmail) {
                console.log(`🔒 [Tool: lookupOrderByNumber] Order email mismatch - Order: ${order.email}, Customer: ${customerEmail}`);
                throw new Error(`Order ${orderNumber} not found or does not belong to your account.`);
            }

            console.log(`✅ [Tool: lookupOrderByNumber] Success in ${duration}ms - Order found and verified:`, {
                orderNumber,
                orderId: order.id,
            });
            return shopifyClient.formatOrderInfo(order);
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: lookupOrderByNumber] Error after ${duration}ms:`, {
                orderNumber,
                chatId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to lookup order: ${error.message}`);
        }
    },
});


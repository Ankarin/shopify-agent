import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createGetProductTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Get detailed information about a specific product including variants, sizes, prices, and inventory. Use this when a customer asks about a specific product.',
    inputSchema: z.object({
        productId: z.string().describe('The product ID to look up'),
    }),
    execute: async ({ productId }) => {
        console.log('🔍 [Tool: getProduct] Called with product ID:', productId);
        const startTime = Date.now();

        try {
            const product = await shopifyClient.getProducts(1);
            const duration = Date.now() - startTime;

            if (!product || product.length === 0) {
                console.log(`⚠️ [Tool: getProduct] Product not found after ${duration}ms:`, productId);
                throw new Error('Product not found.');
            }

            const p = product[0];
            const variants = p.variants.edges.map(({ node }) => ({
                title: node.title,
                price: node.price,
                available: node.inventoryQuantity > 0,
                inventory: node.inventoryQuantity,
            }));

            console.log(`✅ [Tool: getProduct] Success in ${duration}ms:`, {
                productId,
                title: p.title,
                variantsCount: variants.length,
                imagesCount: p.images.edges.length,
            });

            return {
                title: p.title,
                description: p.description,
                variants,
                images: p.images.edges.map(({ node }) => node.url),
            };
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: getProduct] Error after ${duration}ms:`, {
                productId,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to get product: ${error.message}`);
        }
    },
});


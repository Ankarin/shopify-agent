import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createListProductsTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Get a list of available products in the store. Use this when a customer asks about what products are available, wants to browse, or asks general product questions.',
    inputSchema: z.object({
        limit: z.number().min(1).max(50).default(10).describe('Number of products to return (default 10, max 50)'),
    }),
    execute: async ({ limit }) => {
        console.log('🔍 [Tool: listProducts] Called with limit:', limit);
        const startTime = Date.now();

        try {
            const products = await shopifyClient.getProducts(limit);
            const duration = Date.now() - startTime;

            if (products.length === 0) {
                console.log(`⚠️ [Tool: listProducts] No products found after ${duration}ms`);
                throw new Error('No products found in the store.');
            }

            const productList = products.map(p => {
                const priceRange = p.variants.edges.length > 0
                    ? p.variants.edges.map(({ node }) => parseFloat(node.price))
                    : [0];
                const minPrice = Math.min(...priceRange);
                const maxPrice = Math.max(...priceRange);

                return {
                    id: p.id,
                    title: p.title,
                    description: p.description?.substring(0, 200) + (p.description?.length > 200 ? '...' : ''),
                    priceRange: minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`,
                    variantCount: p.variants.edges.length,
                    hasImages: p.images.edges.length > 0,
                };
            });

            console.log(`✅ [Tool: listProducts] Success in ${duration}ms - Returning ${productList.length} products`);

            return productList;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error(`❌ [Tool: listProducts] Error after ${duration}ms:`, {
                limit,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`Failed to list products: ${error.message}`);
        }
    },
});


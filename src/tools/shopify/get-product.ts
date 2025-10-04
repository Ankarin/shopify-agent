import { tool } from "ai";
import { z } from "zod";
import { ShopifyClient } from "@/lib/shopify/client";

export const createGetProductTool = (shopifyClient: ShopifyClient) => tool({
    description: 'Get detailed information about a specific product including variants, sizes, prices, and inventory. Use this when a customer asks about a specific product.',
    inputSchema: z.object({
        productId: z.string().describe('The product ID to look up'),
    }),
    execute: async ({ productId }) => {
        try {
            const product = await shopifyClient.getProducts(1);
            if (!product || product.length === 0) {
                return { success: false, message: 'Product not found.' };
            }

            const p = product[0];
            const variants = p.variants.edges.map(({ node }) => ({
                title: node.title,
                price: node.price,
                available: node.inventoryQuantity > 0,
                inventory: node.inventoryQuantity,
            }));

            return {
                success: true,
                product: {
                    title: p.title,
                    description: p.description,
                    variants,
                    images: p.images.edges.map(({ node }) => node.url),
                }
            };
        } catch (error: any) {
            console.error('Error getting product:', error);
            return { success: false, message: `Failed to get product: ${error.message}` };
        }
    },
});


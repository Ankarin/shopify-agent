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
            const product = await shopifyClient.getProductById(productId);
            const duration = Date.now() - startTime;

            if (!product) {
                console.log(`⚠️ [Tool: getProduct] Product not found after ${duration}ms:`, productId);
                throw new Error('Product not found.');
            }

            const variants = product.variants.edges.map(({ node }) => {
                const totalInventory = node.inventoryItem.inventoryLevels.edges.reduce(
                    (sum, level) => {
                        const availableQty = level.node.quantities.find(q => q.name === 'available');
                        return sum + (availableQty?.quantity || 0);
                    },
                    0
                );
                const inventoryByLocation = node.inventoryItem.inventoryLevels.edges.map(
                    level => {
                        const availableQty = level.node.quantities.find(q => q.name === 'available');
                        return {
                            location: level.node.location.name,
                            available: availableQty?.quantity || 0,
                        };
                    }
                );

                return {
                    title: node.title,
                    price: node.price,
                    availableForSale: node.availableForSale,
                    totalInventory,
                    inventoryByLocation,
                };
            });

            console.log(`✅ [Tool: getProduct] Success in ${duration}ms:`, {
                productId,
                title: product.title,
                variantsCount: variants.length,
                imagesCount: product.images.edges.length,
            });

            return {
                title: product.title,
                description: product.description || 'No description available',
                variants,
                images: product.images.edges.map(({ node }) => node.url),
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


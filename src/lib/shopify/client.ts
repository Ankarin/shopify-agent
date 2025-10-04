interface ShopifyConfig {
    domain: string;
    accessToken: string;
}

interface ShopifyOrder {
    id: string;
    name: string;
    email: string;
    totalPriceSet: {
        shopMoney: {
            amount: string;
            currencyCode: string;
        };
    };
    displayFinancialStatus: string;
    displayFulfillmentStatus: string;
    createdAt: string;
    lineItems: {
        edges: Array<{
            node: {
                name: string;
                quantity: number;
                originalUnitPriceSet: {
                    shopMoney: {
                        amount: string;
                    };
                };
            };
        }>;
    };
    fulfillments: Array<{
        trackingInfo: Array<{
            number: string;
            url: string;
            company: string;
        }>;
        status: string;
    }>;
    shippingAddress?: {
        address1: string;
        city: string;
        province: string;
        country: string;
        zip: string;
    };
}

interface ShopifyProduct {
    id: string;
    title: string;
    description: string;
    variants: {
        edges: Array<{
            node: {
                id: string;
                title: string;
                price: string;
                inventoryQuantity: number;
            };
        }>;
    };
    images: {
        edges: Array<{
            node: {
                url: string;
            };
        }>;
    };
}

export class ShopifyClient {
    private domain: string;
    private accessToken: string;
    private graphqlUrl: string;

    constructor(config: ShopifyConfig) {
        this.domain = config.domain;
        this.accessToken = config.accessToken;
        this.graphqlUrl = `https://${this.domain}/admin/api/2024-10/graphql.json`;
    }

    private async graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
        const response = await fetch(this.graphqlUrl, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': this.accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            throw new Error(`Shopify GraphQL error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        return result.data;
    }

    async getOrderByEmail(email: string): Promise<ShopifyOrder[]> {
        const query = `
      query getOrdersByEmail($email: String!) {
        orders(first: 10, query: $email) {
          edges {
            node {
              id
              name
              email
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    name
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                  }
                }
              }
              fulfillments(first: 5) {
                trackingInfo {
                  number
                  url
                  company
                }
                status
              }
              shippingAddress {
                address1
                city
                province
                country
                zip
              }
            }
          }
        }
      }
    `;

        const data = await this.graphqlRequest<{ orders: { edges: Array<{ node: ShopifyOrder }> } }>(
            query,
            { email }
        );

        return data.orders.edges.map(edge => edge.node);
    }

    async getOrderByNumber(orderNumber: string): Promise<ShopifyOrder | null> {
        const query = `
      query getOrderByName($orderNumber: String!) {
        orders(first: 1, query: $orderNumber) {
          edges {
            node {
              id
              name
              email
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    name
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                  }
                }
              }
              fulfillments(first: 5) {
                trackingInfo {
                  number
                  url
                  company
                }
                status
              }
              shippingAddress {
                address1
                city
                province
                country
                zip
              }
            }
          }
        }
      }
    `;

        const data = await this.graphqlRequest<{ orders: { edges: Array<{ node: ShopifyOrder }> } }>(
            query,
            { orderNumber: `name:${orderNumber}` }
        );

        return data.orders.edges[0]?.node || null;
    }

    async getProducts(limit = 50): Promise<ShopifyProduct[]> {
        const query = `
      query getProducts($limit: Int!) {
        products(first: $limit) {
          edges {
            node {
              id
              title
              description
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    inventoryQuantity
                  }
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

        const data = await this.graphqlRequest<{ products: { edges: Array<{ node: ShopifyProduct }> } }>(
            query,
            { limit }
        );

        return data.products.edges.map(edge => edge.node);
    }

    formatOrderInfo(order: ShopifyOrder): string {
        const items = order.lineItems.edges
            .map(({ node }) => `- ${node.name} (Qty: ${node.quantity}) - $${node.originalUnitPriceSet.shopMoney.amount}`)
            .join('\n');

        let trackingInfo = 'No tracking information available yet.';
        if (order.fulfillments && order.fulfillments.length > 0) {
            const tracking = order.fulfillments[0].trackingInfo[0];
            if (tracking) {
                trackingInfo = `
Tracking Number: ${tracking.number || 'N/A'}
Carrier: ${tracking.company || 'N/A'}
Status: ${order.fulfillments[0].status}
${tracking.url ? `Track here: ${tracking.url}` : ''}`;
            }
        }

        return `
Order ${order.name}
Status: ${order.displayFulfillmentStatus || 'UNFULFILLED'}
Payment: ${order.displayFinancialStatus}
Total: ${order.totalPriceSet.shopMoney.currencyCode} $${order.totalPriceSet.shopMoney.amount}
Date: ${new Date(order.createdAt).toLocaleDateString()}

Items:
${items}

${trackingInfo}`;
    }
}

